terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# ─── ECS Cluster ─────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.env}"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.env}-cluster" })
}

# ─── CloudWatch Log Groups ────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project}-${var.env}/backend"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project}-${var.env}/frontend"
  retention_in_days = 7
  tags              = var.tags
}

# ─── EC2 Host — t2.micro (750 h/month free, first 12 months) ─────────────────
data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

resource "aws_instance" "ecs_host" {
  ami                         = data.aws_ssm_parameter.ecs_ami.value
  instance_type               = "t2.micro"
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.ecs_sg_id]
  iam_instance_profile        = var.instance_profile_name
  associate_public_ip_address = true

  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
    echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
  EOF
  )

  tags = merge(var.tags, { Name = "${var.project}-${var.env}-ecs-host" })
}

# ─── Elastic IP — free while attached to a running instance ──────────────────
resource "aws_eip" "ecs_host" {
  instance = aws_instance.ecs_host.id
  domain   = "vpc"
  tags     = merge(var.tags, { Name = "${var.project}-${var.env}-eip" })
}

# ─── Combined App Task Definition ────────────────────────────────────────────
# host network mode: both containers share the EC2 host's network namespace.
# Nginx (port 80) proxies /api/* and /socket.io/* to the backend at
# 127.0.0.1:5000. Only port 80 is exposed via the security group.
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-${var.env}-app"
  network_mode             = "host"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${var.backend_image}:${var.image_tag}"
      essential = true
      cpu       = 512
      memory    = 512

      # host network mode: container binds directly to host port 5000.
      # Port 5000 is NOT in the security group so it is blocked externally.
      # Nginx reaches it via 127.0.0.1:5000 within the same host.
      portMappings = [{
        containerPort = 5000
        hostPort      = 5000
        protocol      = "tcp"
      }]

      environment = [
        { name = "NODE_ENV",   value = var.env },
        { name = "PORT",       value = "5000" },
        { name = "CLIENT_URL", value = "http://${aws_eip.ecs_host.public_ip}" },
      ]

      secrets = [
        { name = "MONGO_URI",             valueFrom = "${var.ssm_prefix}/MONGO_URI" },
        { name = "JWT_SECRET",            valueFrom = "${var.ssm_prefix}/JWT_SECRET" },
        { name = "CLOUDINARY_CLOUD_NAME", valueFrom = "${var.ssm_prefix}/CLOUDINARY_CLOUD_NAME" },
        { name = "CLOUDINARY_API_KEY",    valueFrom = "${var.ssm_prefix}/CLOUDINARY_API_KEY" },
        { name = "CLOUDINARY_API_SECRET", valueFrom = "${var.ssm_prefix}/CLOUDINARY_API_SECRET" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    },
    {
      name      = "frontend"
      image     = "${var.frontend_image}:${var.image_tag}"
      essential = true
      cpu       = 256
      memory    = 256

      portMappings = [{
        containerPort = 80
        hostPort      = 80
        protocol      = "tcp"
      }]

      dependsOn = [{
        containerName = "backend"
        condition     = "HEALTHY"
      }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "frontend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = var.tags
}

# ─── ECS Service ──────────────────────────────────────────────────────────────
resource "aws_ecs_service" "app" {
  name            = "${var.project}-${var.env}-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1

  # host network mode: only one task can run per instance (port conflict otherwise)
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = var.tags
}
