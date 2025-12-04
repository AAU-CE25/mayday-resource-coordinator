terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ECR Repository
resource "aws_ecr_repository" "frontend" {
  name                 = "frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = "frontend"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.cluster_name}/frontend"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-frontend-logs"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.cluster_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/frontend:latest"
    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-frontend-task"
  })
}

# Service Discovery Service
resource "aws_service_discovery_service" "frontend" {
  name = "frontend"

  dns_config {
    namespace_id = var.service_discovery_namespace_id

    dns_records {
      ttl  = 60
      type = "A"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-frontend-discovery"
  })
}

# ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "${var.cluster_name}-frontend-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.frontend.arn
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-frontend-service"
  })
}
