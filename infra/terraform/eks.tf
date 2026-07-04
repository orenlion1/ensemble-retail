resource "aws_iam_role" "eks_cluster" {
  name = "ensemble-grafana-eks-cluster"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/ensemble-grafana/cluster"
  retention_in_days = 14
}

resource "aws_eks_cluster" "main" {
  name     = "ensemble-grafana"
  role_arn = aws_iam_role.eks_cluster.arn
  # Only "api"/"audit" are used (docs/security.md requires audit logging); the other control-plane
  # log types produced continuous, unused chatter that ate into the CloudWatch Logs free tier.
  enabled_cluster_log_types = ["api", "audit"]
  vpc_config {
    subnet_ids              = concat(local.private_subnet_ids, local.public_subnet_ids)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [aws_cloudwatch_log_group.eks_cluster]
}

data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_role" "eks_nodes" {
  name = "ensemble-grafana-eks-nodes"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ecr" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_eks_node_group" "small" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "small-2-node"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = local.private_subnet_ids
  instance_types  = ["t3.medium"]

  labels = {
    "ensemble-grafana/profiling" = "enabled"
  }

  scaling_config {
    desired_size = 3
    max_size     = 3
    min_size     = 3
  }
}

locals {
  oidc_provider = replace(aws_iam_openid_connect_provider.eks.url, "https://", "")
}

data "aws_iam_policy_document" "inventory_service_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_provider}:sub"
      values   = ["system:serviceaccount:ensemble-grafana:inventory-service"]
    }
  }
}

data "aws_iam_policy_document" "cart_service_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_provider}:sub"
      values   = ["system:serviceaccount:ensemble-grafana:cart-service"]
    }
  }
}

data "aws_iam_policy_document" "account_service_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_provider}:sub"
      values   = ["system:serviceaccount:ensemble-grafana:account-service"]
    }
  }
}

resource "aws_iam_role" "inventory_service" {
  name               = "ensemble-grafana-inventory-service"
  assume_role_policy = data.aws_iam_policy_document.inventory_service_assume_role.json
}

resource "aws_iam_role" "cart_service" {
  name               = "ensemble-grafana-cart-service"
  assume_role_policy = data.aws_iam_policy_document.cart_service_assume_role.json
}

resource "aws_iam_role" "account_service" {
  name               = "ensemble-grafana-account-service"
  assume_role_policy = data.aws_iam_policy_document.account_service_assume_role.json
}

data "aws_iam_policy_document" "cart_service" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"]
    resources = [aws_dynamodb_table.carts.arn]
  }
}

data "aws_iam_policy_document" "account_service" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.accounts.arn]
  }
}

data "aws_iam_policy_document" "inventory_service" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app_runtime.arn]
  }
}

resource "aws_iam_role_policy" "cart_service" {
  name   = "cart-dynamodb"
  role   = aws_iam_role.cart_service.id
  policy = data.aws_iam_policy_document.cart_service.json
}

resource "aws_iam_role_policy" "account_service" {
  name   = "account-dynamodb"
  role   = aws_iam_role.account_service.id
  policy = data.aws_iam_policy_document.account_service.json
}

resource "aws_iam_role_policy" "inventory_service" {
  name   = "inventory-secrets"
  role   = aws_iam_role.inventory_service.id
  policy = data.aws_iam_policy_document.inventory_service.json
}
