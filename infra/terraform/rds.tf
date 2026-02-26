# ── RDS Aurora PostgreSQL ─────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name        = "${var.app_name}-db-subnet-group"
  description = "Smartboard RDS subnet group"
  subnet_ids  = aws_subnet.private[*].id
  tags        = { Name = "${var.app_name}-db-subnet-group" }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.app_name}-aurora-pg"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "smartboard"
  master_username         = "smartboard"
  manage_master_user_password = true  # Secrets Manager managed password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period   = 7
  preferred_backup_window   = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  deletion_protection       = true
  storage_encrypted         = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.app_name}-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = { Name = "${var.app_name}-aurora-pg" }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2  # writer + reader
  identifier         = "${var.app_name}-aurora-pg-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.rds_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = { Name = "${var.app_name}-aurora-pg-${count.index}" }
}

# Enhanced monitoring role for RDS
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.app_name}-rds-monitoring-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
