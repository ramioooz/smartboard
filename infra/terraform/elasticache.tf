# ── ElastiCache Redis ─────────────────────────────────────────────────────────

resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.app_name}-redis-subnet-group"
  description = "Smartboard Redis subnet group"
  subnet_ids  = aws_subnet.private[*].id
  tags        = { Name = "${var.app_name}-redis-subnet-group" }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.app_name}-redis"
  description          = "Smartboard Redis — BullMQ queues + pub/sub"

  node_type            = var.redis_node_type
  num_cache_clusters   = 1  # single node for MVP; increase for HA
  engine_version       = "7.1"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = aws_secretsmanager_secret_version.redis_auth_token.secret_string

  automatic_failover_enabled = false  # requires num_cache_clusters >= 2

  snapshot_retention_limit = 1
  snapshot_window          = "04:00-05:00"
  maintenance_window       = "sun:05:00-sun:06:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = { Name = "${var.app_name}-redis" }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/smartboard/${var.environment}/redis"
  retention_in_days = 14
}

# Redis auth token — generated and stored in Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth_token" {
  name                    = "smartboard/${var.environment}/redis/auth-token"
  description             = "ElastiCache Redis auth token"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth_token.result
}

resource "random_password" "redis_auth_token" {
  length           = 64
  special          = false  # ElastiCache auth token: alphanumeric only
}
