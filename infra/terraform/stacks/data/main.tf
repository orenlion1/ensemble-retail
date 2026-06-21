resource "aws_dynamodb_table" "carts" {
  name                        = "ensemble-carts"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "shopperId"
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "shopperId"
    type = "S"
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "cart"
  }
}

resource "aws_dynamodb_table" "accounts" {
  name                        = "ensemble-accounts"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "shopperId"
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "shopperId"
    type = "S"
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "account"
  }
}

resource "aws_db_subnet_group" "inventory" {
  name       = "ensemble-inventory"
  subnet_ids = var.private_subnet_ids

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "inventory"
  }
}

resource "aws_security_group" "inventory_db" {
  name        = "ensemble-inventory-db"
  description = "Restrict inventory Postgres to EKS workloads"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Postgres from EKS cluster security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.eks_cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "inventory"
  }
}

resource "aws_rds_cluster" "inventory" {
  cluster_identifier        = "ensemble-inventory"
  engine                    = "aurora-postgresql"
  database_name             = "ensemble_inventory"
  master_username           = "ensemble"
  master_password           = var.inventory_db_password
  db_subnet_group_name      = aws_db_subnet_group.inventory.name
  vpc_security_group_ids    = [aws_security_group.inventory_db.id]
  backup_retention_period   = 7
  copy_tags_to_snapshot     = true
  deletion_protection       = true
  storage_encrypted         = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "ensemble-inventory-final"

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "inventory"
  }
}

resource "aws_rds_cluster_instance" "inventory_writer" {
  identifier          = "ensemble-inventory-writer-1"
  cluster_identifier  = aws_rds_cluster.inventory.id
  instance_class      = "db.t4g.medium"
  engine              = aws_rds_cluster.inventory.engine
  engine_version      = aws_rds_cluster.inventory.engine_version
  publicly_accessible = false

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "inventory"
  }
}

resource "aws_secretsmanager_secret" "app_runtime" {
  name                    = "ensemble-grafana/runtime"
  recovery_window_in_days = 30

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
  }
}
