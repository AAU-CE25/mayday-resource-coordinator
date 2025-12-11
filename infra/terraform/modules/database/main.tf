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
resource "aws_ecs_task_definition" "db" {
  family                   = "${var.cluster_name}-db"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "db"
    image     = "postgres:18"
    essential = true

    portMappings = [{
      containerPort = 5432
      protocol      = "tcp"
    }]

    environment = [
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
        name  = "PGDATA"
        value = "/var/lib/postgresql/data/pgdata"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "db"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "pg_isready -U postgres -d mayday"]
      interval    = 10
      timeout     = 5
      retries     = 5
      startPeriod = 30
    }
  }])

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-db-task"
  })
}

# Service Discovery Service
resource "aws_service_discovery_service" "db" {
  name = "db"

  dns_config {
    namespace_id = var.service_discovery_namespace_id

    dns_records {
      ttl  = 60
      type = "A"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-db-discovery"
  })
}

# ECS Service
resource "aws_ecs_service" "db" {
  name            = "${var.cluster_name}-db-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.db.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false # Database in private subnet, no public IP needed
  }

  service_registries {
    registry_arn = aws_service_discovery_service.db.arn
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-db-service"
  })
}
