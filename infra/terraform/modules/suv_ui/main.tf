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
resource "aws_ecr_repository" "suv_ui" {
  name                 = "suv_ui"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = "suv_ui"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "suv_ui" {
  name              = "/ecs/${var.cluster_name}/suv_ui"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-suv-ui-logs"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "suv_ui" {
  family                   = "${var.cluster_name}-suv-ui"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "suv_ui"
    image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/suv_ui:latest"
    essential = true

    portMappings = [{
      containerPort = 3030
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "PORT"
        value = "3030"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.suv_ui.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-suv-ui-task"
  })
}

# Service Discovery Service
resource "aws_service_discovery_service" "suv_ui" {
  name = "suv-ui"

  dns_config {
    namespace_id = var.service_discovery_namespace_id

    dns_records {
      ttl  = 60
      type = "A"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-suv-ui-discovery"
  })
}

# ECS Service
resource "aws_ecs_service" "suv_ui" {
  name            = "${var.cluster_name}-suv-ui-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.suv_ui.arn
  desired_count   = 2 # Increased for high availability
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "suv_ui"
    container_port   = 3030
  }

  service_registries {
    registry_arn = aws_service_discovery_service.suv_ui.arn
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-suv-ui-service"
  })
}

# Autoscaling Target
resource "aws_appautoscaling_target" "suv_ui" {
  max_capacity       = 4
  min_capacity       = 2
  resource_id        = "service/${var.ecs_cluster_id}/${aws_ecs_service.suv_ui.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.suv_ui]
}

# Autoscaling Policy - CPU
resource "aws_appautoscaling_policy" "suv_ui_cpu" {
  name               = "${var.cluster_name}-suv-ui-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.suv_ui.resource_id
  scalable_dimension = aws_appautoscaling_target.suv_ui.scalable_dimension
  service_namespace  = aws_appautoscaling_target.suv_ui.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
