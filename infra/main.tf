locals {
	name_prefix = var.project_name
	tags = {
		Project   = var.project_name
		ManagedBy = "terraform"
		Environment = "production"
	}
}

data "aws_iam_policy_document" "ecs_task_execution_assume" {
	statement {
		actions = ["sts:AssumeRole"]

		principals {
			type        = "Service"
			identifiers = ["ecs-tasks.amazonaws.com"]
		}
	}
}

resource "aws_iam_role" "ecs_task_execution_role" {
	name               = "${local.name_prefix}-ecs-execution-role"
	assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume.json
	tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
	role       = aws_iam_role.ecs_task_execution_role.name
	policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_task_secrets" {
	statement {
		sid     = "AllowReadSecrets"
		actions = [
			"secretsmanager:GetSecretValue",
			"secretsmanager:DescribeSecret"
		]
		resources = [
			aws_secretsmanager_secret.db_password.arn,
			aws_secretsmanager_secret.jwt_secret.arn
		]
	}

	statement {
		sid     = "AllowReadParameters"
		actions = [
			"ssm:GetParameter",
			"ssm:GetParameters"
		]
		resources = [aws_ssm_parameter.db_user.arn]
	}
}

resource "aws_iam_role_policy" "ecs_task_secrets" {
	name   = "${local.name_prefix}-ecs-secrets"
	role   = aws_iam_role.ecs_task_execution_role.id
	policy = data.aws_iam_policy_document.ecs_task_secrets.json
}

resource "aws_cloudwatch_log_group" "ecs" {
	name              = "/ecs/${local.name_prefix}"
	retention_in_days = 14
	tags              = local.tags
}

resource "aws_security_group" "ecs_service" {
	count  = var.app_active ? 1 : 0
	name   = "${local.name_prefix}-ecs-sg"
	vpc_id = var.vpc_id

	description = "Security group for ${local.name_prefix} ECS service"

	ingress {
		description = "Allow HTTP traffic"
		from_port   = 8080
		to_port     = 8080
		protocol    = "tcp"
		cidr_blocks = ["0.0.0.0/0"]
	}

	egress {
		from_port   = 0
		to_port     = 0
		protocol    = "-1"
		cidr_blocks = ["0.0.0.0/0"]
	}

	tags = local.tags
}

output "ecs_security_group_id" {
	value       = var.app_active ? aws_security_group.ecs_service[0].id : null
	description = "Security group assigned to the ECS service"
}

output "ecs_execution_role_arn" {
	value       = aws_iam_role.ecs_task_execution_role.arn
	description = "ARN of the ECS task execution role"
}

