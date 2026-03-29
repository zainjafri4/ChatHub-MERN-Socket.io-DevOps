terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# ECS host is in a public subnet. Internet reaches it directly on ports 80 and
# 5000 — no ALB, no NAT, fully free tier.
resource "aws_security_group" "ecs" {
  name        = "${var.project}-${var.env}-sg-ecs"
  description = "ECS host — allow frontend (80) and backend (5000) from internet"
  vpc_id      = var.vpc_id

  ingress {
    description = "Frontend (Nginx)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API + Socket.io"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow containers on the same host to talk to each other
  # (Prometheus scraping backend /metrics, Grafana querying Prometheus)
  ingress {
    description = "Internal container traffic"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.env}-sg-ecs" })
}
