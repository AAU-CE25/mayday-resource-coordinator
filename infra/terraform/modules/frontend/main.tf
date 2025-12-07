terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
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

    environment = [
      {
        name  = "NEXT_PUBLIC_API_URL"
        value = var.api_url
      }
    ]

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
  desired_count   = 1 # Increased for high availability
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "frontend"
    container_port   = 3000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.frontend.arn
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-frontend-service"
  })
}

# Autoscaling Target
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${var.ecs_cluster_id}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.frontend]
}

# Autoscaling Policy - CPU
resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${var.cluster_name}-frontend-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
