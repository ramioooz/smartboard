# ── ALB ───────────────────────────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Allow HTTPS inbound from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-alb-sg" }
}

# ── Web (Next.js) ─────────────────────────────────────────────────────────────

resource "aws_security_group" "web" {
  name        = "${var.app_name}-web-sg"
  description = "Allow traffic from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-web-sg" }
}

# ── Gateway ───────────────────────────────────────────────────────────────────

resource "aws_security_group" "gateway" {
  name        = "${var.app_name}-gateway-sg"
  description = "Allow traffic from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-gateway-sg" }
}

# ── Internal Services ─────────────────────────────────────────────────────────

resource "aws_security_group" "services" {
  name        = "${var.app_name}-services-sg"
  description = "Internal service-to-service communication"
  vpc_id      = aws_vpc.main.id

  # Allow gateway to reach all internal services
  ingress {
    from_port       = 4010
    to_port         = 4070
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id, aws_security_group.web.id]
  }

  # Allow service-to-service calls
  ingress {
    from_port = 4010
    to_port   = 4070
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-services-sg" }
}

# ── RDS ───────────────────────────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "PostgreSQL access from ECS services only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id, aws_security_group.gateway.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-rds-sg" }
}

# ── ElastiCache ───────────────────────────────────────────────────────────────

resource "aws_security_group" "redis" {
  name        = "${var.app_name}-redis-sg"
  description = "Redis access from ECS services only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-redis-sg" }
}
