# Smartboard — Terraform

Infrastructure as Code for deploying Smartboard to AWS using ECS Fargate.

## Files

| File | Description |
|---|---|
| `providers.tf` | AWS provider config, required versions, S3 backend (commented) |
| `variables.tf` | All input variables with defaults |
| `vpc.tf` | VPC, public/private subnets, IGW, NAT gateways, route tables |
| `security-groups.tf` | SGs for ALB, web, gateway, internal services, RDS, Redis |
| `rds.tf` | Aurora PostgreSQL cluster + instances, enhanced monitoring |
| `elasticache.tf` | Redis replication group, auth token in Secrets Manager |
| `s3.tf` | Datasets bucket with versioning, encryption, CORS, lifecycle |
| `ecs.tf` | ECS cluster, Cloud Map, IAM roles, CloudWatch log groups |
| `alb.tf` | ALB, target groups, HTTPS listener, path routing |
| `outputs.tf` | Key resource identifiers and endpoints |

## Usage

```bash
cd infra/terraform

# Initialise
terraform init

# Preview changes
terraform plan -var="domain_name=smartboard.io" -var="acm_certificate_arn=arn:aws:acm:..."

# Apply
terraform apply -var="domain_name=smartboard.io" -var="acm_certificate_arn=arn:aws:acm:..."
```

## Required Variables

| Variable | Description |
|---|---|
| `domain_name` | Your root domain (e.g. `smartboard.io`) |
| `acm_certificate_arn` | ARN of an ACM certificate covering `*.domain_name` |

## What This Does NOT Provision

The following are intentionally left for CI/CD or separate automation:

- ECS Task Definitions (managed by deploy workflow per service)
- ECR repositories (see `modules/ecr/`)
- DB schema migrations (run via ECS run-task in deploy pipeline)
- DNS records (managed in Route 53 or external DNS)
- GitHub Actions OIDC IAM role

## Next Steps After `terraform apply`

1. Push Docker images to ECR
2. Register ECS Task Definitions per service
3. Create ECS Services (reference task defs + this cluster)
4. Run DB migrations via ECS run-task
5. Update DNS CNAME to ALB DNS name (from outputs)
