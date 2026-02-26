# Smartboard — Terraform Scaffold

> **Phase 1 placeholder.** Full Terraform configuration added in Phase 8.

## Planned Resources

- `aws_ecs_cluster` — ECS Fargate cluster
- `aws_ecs_task_definition` per service (web, gateway, svc-*)
- `aws_lb` + `aws_lb_listener` — Application Load Balancer
- `aws_rds_cluster` — Aurora PostgreSQL
- `aws_elasticache_cluster` — Redis (ElastiCache)
- `aws_s3_bucket` — Datasets storage (MinIO replacement)
- `aws_secretsmanager_secret` — App secrets
- `aws_cloudwatch_log_group` per service
- `aws_service_discovery_*` — Cloud Map for internal service discovery
