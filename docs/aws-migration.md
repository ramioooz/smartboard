# AWS Migration Guide

> Mapping every local Docker Compose service to its AWS equivalent for production deployment.

---

## Service → AWS Mapping

| Local (Docker Compose) | AWS Equivalent | Notes |
|---|---|---|
| Next.js web (`localhost:3000`) | ECS Fargate + ALB | Public-facing, HTTPS via ACM |
| NestJS gateway (`localhost:4000`) | ECS Fargate + ALB | Public-facing, same ALB different path |
| svc-auth (`:4010`) | ECS Fargate (private) | No public exposure, Cloud Map DNS |
| svc-tenants (`:4020`) | ECS Fargate (private) | No public exposure, Cloud Map DNS |
| svc-datasets (`:4030`) | ECS Fargate (private) | No public exposure, Cloud Map DNS |
| svc-analytics (`:4040`) | ECS Fargate (private) | No public exposure, Cloud Map DNS |
| svc-dashboards (`:4050`) | ECS Fargate (private) | No public exposure, Cloud Map DNS |
| svc-realtime (`:4060`) | ECS Fargate (private) | SSE proxied through gateway |
| worker (`:4070`) | ECS Fargate (private) | No inbound traffic, outbound only |
| PostgreSQL (`:5432`) | Amazon RDS Aurora PostgreSQL | Single cluster, per-service schemas |
| Redis (`:6379`) | Amazon ElastiCache (Redis OSS) | BullMQ queues + pub/sub |
| MinIO (`:9000`) | Amazon S3 | Object storage for datasets |

---

## Infrastructure Architecture

```
Internet
    │
    ▼
┌─────────────────────────────┐
│   Application Load Balancer │  (HTTPS :443 → ACM cert)
│   WAF — OWASP managed rules │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│  web   │  │ gateway  │  (ECS Fargate — public subnets via ALB)
│ :3000  │  │  :4000   │
└────────┘  └────┬─────┘
                 │  (private VPC, Cloud Map DNS)
    ┌────────────┼────────────────────┐
    ▼            ▼                    ▼
┌────────┐  ┌────────┐  ┌──────────────────────┐
│svc-auth│  │svc-*   │  │       worker         │
│  :4010 │  │:4020-  │  │  (no inbound port)   │
└────────┘  │ 4060   │  └──────────┬───────────┘
            └───┬────┘             │
                │                  │
    ┌───────────┼──────────────────┤
    ▼           ▼                  ▼
┌─────────┐ ┌────────────┐ ┌────────────┐
│  RDS    │ │ElastiCache │ │     S3     │
│ Aurora  │ │   Redis    │ │  datasets  │
│  Pg     │ │            │ │   bucket   │
└─────────┘ └────────────┘ └────────────┘
```

---

## Step-by-Step Migration Checklist

### 1. Networking

- [ ] Create VPC with CIDR `10.0.0.0/16`
- [ ] 2x public subnets (ALB, NAT Gateway) in different AZs
- [ ] 4x private subnets (ECS tasks, RDS, ElastiCache) in different AZs
- [ ] Internet Gateway attached to VPC
- [ ] NAT Gateway in each public subnet (for ECS task outbound)
- [ ] Security groups:
  - `sg-alb` — inbound 443 from `0.0.0.0/0`
  - `sg-web` — inbound 3000 from `sg-alb` only
  - `sg-gateway` — inbound 4000 from `sg-alb` only
  - `sg-services` — inbound 4010–4070 from `sg-gateway` + `sg-services`
  - `sg-rds` — inbound 5432 from `sg-services`
  - `sg-redis` — inbound 6379 from `sg-services`

### 2. ECR — Container Registries

- [ ] Create one ECR repo per service:
  ```
  smartboard-web
  smartboard-gateway
  smartboard-svc-auth
  smartboard-svc-tenants
  smartboard-svc-datasets
  smartboard-svc-analytics
  smartboard-svc-dashboards
  smartboard-svc-realtime
  smartboard-worker
  ```
- [ ] Add lifecycle policy: keep last 10 images
- [ ] Add ECR image scanning on push

### 3. RDS — Aurora PostgreSQL

- [ ] Create Aurora PostgreSQL cluster (engine `aurora-postgresql`, version 15+)
- [ ] Instance class: `db.t4g.medium` (MVP), scale up as needed
- [ ] Multi-AZ: enabled (automatic failover)
- [ ] DB name: `smartboard`
- [ ] Store credentials in AWS Secrets Manager: `smartboard/rds/credentials`
- [ ] Disable public accessibility — private subnet only
- [ ] Parameter group: enable `pg_stat_statements`
- [ ] Run migrations per service after provisioning:
  ```bash
  DATABASE_URL=postgresql://user:pass@rds-host:5432/smartboard?schema=auth \
    pnpm --filter @smartboard/svc-auth db:migrate
  ```

### 4. ElastiCache — Redis

- [ ] Create Redis OSS cluster (engine 7.x)
- [ ] Node type: `cache.t4g.small` (MVP)
- [ ] Cluster mode: **disabled** (BullMQ requires single-node or Cluster mode carefully configured)
- [ ] Enable at-rest encryption + in-transit TLS
- [ ] Store auth token in Secrets Manager: `smartboard/redis/auth-token`
- [ ] Update `REDIS_URL` env var: `rediss://:TOKEN@cluster-endpoint:6379`

### 5. S3 — Dataset Storage

- [ ] Create bucket: `smartboard-datasets-<env>` (e.g., `smartboard-datasets-prod`)
- [ ] Block all public access
- [ ] Enable versioning
- [ ] Server-side encryption: SSE-S3 (or SSE-KMS for stricter compliance)
- [ ] Lifecycle rule: transition to Glacier after 90 days
- [ ] CORS configuration for presigned PUT uploads:
  ```json
  [{ "AllowedOrigins": ["https://yourdomain.com"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
  ```
- [ ] Replace MinIO env vars with AWS SDK credentials (use ECS task role — no access keys):
  ```
  AWS_REGION=eu-west-1
  MINIO_BUCKET_DATASETS=smartboard-datasets-prod
  ```
- [ ] Update `MinioService` → use `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`

### 6. Secrets Manager + SSM

- [ ] Store in Secrets Manager (rotatable secrets):
  - `smartboard/rds/credentials` → `{ username, password }`
  - `smartboard/redis/auth-token`
  - `smartboard/app/jwt-secret`
  - `smartboard/app/session-secret`
  - `smartboard/oidc/microsoft-client-secret`
- [ ] Store in SSM Parameter Store (non-secret config):
  - `/smartboard/prod/node-env` → `production`
  - `/smartboard/prod/log-level` → `info`
  - `/smartboard/prod/microsoft-tenant-id`
  - `/smartboard/prod/microsoft-client-id`

### 7. ECS Cluster + Services

- [ ] Create ECS cluster: `smartboard-prod`
- [ ] Create CloudWatch Log Groups per service: `/smartboard/prod/<service>`
- [ ] Create ECS Task Definitions per service with:
  - CPU/memory: start with 256 CPU / 512 MB, tune from CloudWatch metrics
  - Container image: `<account>.dkr.ecr.<region>.amazonaws.com/smartboard-<service>:latest`
  - Environment variables from SSM + Secrets Manager (use `secrets` in task def)
  - Log driver: `awslogs` → CloudWatch
  - Health check: `GET /health/ready` every 30s
- [ ] Create ECS Services with:
  - Launch type: `FARGATE`
  - Desired count: 1 (MVP), configure auto-scaling later
  - VPC + private subnets + `sg-services` security group
  - Service discovery: Cloud Map namespace `smartboard.internal`

### 8. Cloud Map — Service Discovery

- [ ] Create Cloud Map namespace: `smartboard.internal` (private DNS)
- [ ] Each ECS service registers a Cloud Map service: `svc-auth.smartboard.internal`, etc.
- [ ] Update gateway env vars:
  ```
  AUTH_BASE_URL=http://svc-auth.smartboard.internal:4010
  TENANTS_BASE_URL=http://svc-tenants.smartboard.internal:4020
  DATASETS_BASE_URL=http://svc-datasets.smartboard.internal:4030
  ANALYTICS_BASE_URL=http://svc-analytics.smartboard.internal:4040
  DASHBOARDS_BASE_URL=http://svc-dashboards.smartboard.internal:4050
  REALTIME_BASE_URL=http://svc-realtime.smartboard.internal:4060
  ```

### 9. Application Load Balancer

- [ ] Create ALB in public subnets with `sg-alb`
- [ ] HTTPS listener on port 443 with ACM certificate
- [ ] HTTP → HTTPS redirect on port 80
- [ ] Target groups:
  - `tg-web` → ECS service `smartboard-web`, port 3000, health `/health/ready`
  - `tg-gateway` → ECS service `smartboard-gateway`, port 4000, health `/health/ready`
- [ ] Listener rules:
  - `/api/*` → `tg-gateway`
  - `/*` → `tg-web`

### 10. IAM Task Roles

- [ ] Create task execution role: `smartboard-ecs-execution-role`
  - Policies: `AmazonECSTaskExecutionRolePolicy`, `SecretsManagerReadWrite` (scoped to `smartboard/*`)
- [ ] Create task role per service with least-privilege:
  - `svc-datasets` task role: S3 `PutObject` on `smartboard-datasets-prod/*`
  - `worker` task role: S3 `GetObject` on `smartboard-datasets-prod/*`
  - All others: no S3 access

### 11. CI/CD — GitHub Actions

- [ ] Add GitHub Actions workflow: `.github/workflows/deploy.yml`
- [ ] Trigger: push to `main` after CI passes
- [ ] Steps:
  1. Configure AWS credentials (OIDC — no long-lived keys)
  2. Login to ECR
  3. Build + tag + push Docker images
  4. Run DB migrations (ECS run-task with migration command)
  5. Update ECS service (force new deployment)
- [ ] Store in GitHub Secrets: `AWS_ROLE_TO_ASSUME`, `AWS_REGION`, `ECR_REGISTRY`

### 12. Monitoring

- [ ] CloudWatch alarms:
  - ECS service `HealthyHostCount < 1` → SNS alert
  - RDS `CPUUtilization > 80%` → SNS alert
  - ElastiCache `EngineCPUUtilization > 80%` → SNS alert
  - ALB `TargetResponseTime > 2s` → SNS alert
  - ALB `HTTPCode_Target_5XX_Count > 10/min` → SNS alert
- [ ] CloudWatch Dashboard: ECS CPU/memory, RDS connections, Redis memory, ALB latency
- [ ] Enable RDS Performance Insights
- [ ] Enable Container Insights on ECS cluster

---

## Environment Variable Mapping

| Local `.env` | AWS Source | Notes |
|---|---|---|
| `DATABASE_URL_*` | Secrets Manager | Built from RDS host + credentials |
| `REDIS_URL` | Secrets Manager | ElastiCache endpoint + auth token |
| `MINIO_*` | SSM + task role | Replace with S3 bucket name + IAM role |
| `JWT_SECRET` | Secrets Manager | Minimum 32 chars random |
| `SESSION_SECRET` | Secrets Manager | Minimum 32 chars random |
| `MICROSOFT_CLIENT_*` | Secrets Manager | Azure App Registration values |
| `NODE_ENV` | SSM | `production` |
| `LOG_LEVEL` | SSM | `info` |
| `DEV_BYPASS_AUTH` | **Do not set** | Must be absent in production |

---

## Cost Estimate (MVP — eu-west-1)

| Resource | Spec | Est. Monthly |
|---|---|---|
| ECS Fargate (9 services × 0.25 vCPU / 0.5 GB) | ~2.25 vCPU total | ~$40 |
| RDS Aurora PostgreSQL (`db.t4g.medium`) | Multi-AZ | ~$80 |
| ElastiCache Redis (`cache.t4g.small`) | Single node | ~$25 |
| S3 + data transfer | 10 GB storage | ~$5 |
| ALB | 1 ALB | ~$20 |
| CloudWatch Logs (all services) | 10 GB/month | ~$5 |
| NAT Gateway | 2× | ~$70 |
| **Total** | | **~$245/month** |

> Tip: Use `FARGATE_SPOT` for worker and non-critical services to cut costs ~70%.
