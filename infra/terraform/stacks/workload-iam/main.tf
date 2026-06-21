locals {
  oidc_provider = replace(var.oidc_provider_url, "https://", "")
}

data "aws_iam_policy_document" "inventory_service_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
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
      identifiers = [var.oidc_provider_arn]
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
      identifiers = [var.oidc_provider_arn]
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
    resources = [var.cart_table_arn]
  }
}

data "aws_iam_policy_document" "account_service" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
    resources = [var.account_table_arn]
  }
}

data "aws_iam_policy_document" "inventory_service" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.app_runtime_secret_arn]
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
