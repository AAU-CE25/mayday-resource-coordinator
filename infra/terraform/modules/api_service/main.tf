terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.cluster_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "api_service"
    image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/api_service:latest"
    essential = true

    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "POSTGRES_HOST"
        value = var.db_host
      },
      {
        name  = "POSTGRES_USER"
        value = var.postgres_user
      },
      {
        name  = "POSTGRES_PASSWORD"
        value = var.postgres_password
      },
      {
        name  = "POSTGRES_DB"
        value = var.postgres_db
      },
      {
        name  = "POSTGRES_PORT"
        value = "5432"
      },
      {
        name  = "CORS_ALLOW_ALL"
        value = "true"
      },
      {
        name  = "SECRET_KEY"
        value = var.secret_key
      },
      {
        name  = "ADMIN_NAME"
        value = var.admin_name
      },
      {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      },
      {
        name  = "ADMIN_PHONE"
        value = var.admin_phone
      },
      {
        name  = "ADMIN_PASSWORD"
        value = var.admin_password
      },
      {
        name  = "ENVIRONMENT"
        value = "production"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-api-task"
  })
}

# Service Discovery Service
resource "aws_service_discovery_service" "api" {
  name = "api"

  dns_config {
    namespace_id = var.service_discovery_namespace_id

    dns_records {
      ttl  = 60
      type = "A"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-api-discovery"
  })
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "${var.cluster_name}-api-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1 # Increased from 1 for high availability
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "api_service"
    container_port   = 8000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }

  depends_on = [aws_ecs_task_definition.api]

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-api-service"
  })
}

# Autoscaling Target
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 3
  min_capacity       = 0
  resource_id        = "service/${var.ecs_cluster_id}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.api]
}

# Autoscaling Policy - CPU
resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.cluster_name}-api-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Autoscaling Policy - Memory
resource "aws_appautoscaling_policy" "api_memory" {
  name               = "${var.cluster_name}-api-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
