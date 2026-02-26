# ── ECS Cluster ───────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.app_name}-${var.environment}" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ── Cloud Map Namespace ───────────────────────────────────────────────────────

resource "aws_service_discovery_private_dns_namespace" "internal" {
  name        = "${var.app_name}.internal"
  description = "Private DNS namespace for service-to-service discovery"
  vpc         = aws_vpc.main.id
}

# ── IAM — Task Execution Role (shared) ───────────────────────────────────────

resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow execution role to read Secrets Manager
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "read-smartboard-secrets"
  role = aws_iam_role.ecs_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "ssm:GetParameters"]
      Resource = [
        "arn:aws:secretsmanager:${var.aws_region}:*:secret:smartboard/${var.environment}/*",
        "arn:aws:ssm:${var.aws_region}:*:parameter/smartboard/${var.environment}/*",
      ]
    }]
  })
}

# ── IAM — Task Role: svc-datasets (needs S3 PutObject) ───────────────────────

resource "aws_iam_role" "task_svc_datasets" {
  name = "${var.app_name}-svc-datasets-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "svc_datasets_s3" {
  name = "s3-datasets-put"
  role = aws_iam_role.task_svc_datasets.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject"]
      Resource = "${aws_s3_bucket.datasets.arn}/*"
    }]
  })
}

# ── IAM — Task Role: worker (needs S3 GetObject) ──────────────────────────────

resource "aws_iam_role" "task_worker" {
  name = "${var.app_name}-worker-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "worker_s3" {
  name = "s3-datasets-get"
  role = aws_iam_role.task_worker.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = "${aws_s3_bucket.datasets.arn}/*"
    }]
  })
}

# ── CloudWatch Log Groups (one per service) ───────────────────────────────────

locals {
  services = ["web", "gateway", "svc-auth", "svc-tenants", "svc-datasets",
              "svc-analytics", "svc-dashboards", "svc-realtime", "worker"]
}

resource "aws_cloudwatch_log_group" "services" {
  for_each          = toset(local.services)
  name              = "/smartboard/${var.environment}/${each.key}"
  retention_in_days = 30
}
