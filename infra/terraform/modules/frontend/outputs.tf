output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.frontend.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "service_discovery_arn" {
  description = "ARN of the service discovery service"
  value       = aws_service_discovery_service.frontend.arn
}
