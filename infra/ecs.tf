resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  count = var.app_active ? 1 : 0
}

resource "aws_ecs_task_definition" "app" {
  count                 = var.app_active ? 1 : 0
  family                = "${var.project_name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode          = "awsvpc"
  cpu                   = var.ecs_task_cpu
  memory                = var.ecs_task_memory
  execution_role_arn    = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.api_repo.repository_url}:${var.api_image_tag}"
      essential = true
      portMappings = [
        { containerPort = 8080, hostPort = 8080 }
      ]
      secrets = [
        { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
        { name = "DB_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn }
      ]
      environment = [
        { name = "DB_USER", value = aws_ssm_parameter.db_user.value },
        { name = "ENV", value = "production" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "api"
        }
      }
    },
    {
      name      = "db"
      image     = "${aws_ecr_repository.db_repo.repository_url}:${var.db_image_tag}"
      essential = true
      portMappings = [
        { containerPort = 5432, hostPort = 5432 }
      ]
      secrets = [
        { name = "POSTGRES_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn }
      ]
      environment = [
        { name = "POSTGRES_USER", value = aws_ssm_parameter.db_user.value }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "db"
        }
      }
    }
  ])
}

# ECS Service + Networking (only if app_active)
resource "aws_ecs_service" "app" {
  count           = var.app_active ? 1 : 0
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.app[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.subnets
    assign_public_ip = true
    security_groups = [aws_security_group.ecs_service[0].id]
  }
}
