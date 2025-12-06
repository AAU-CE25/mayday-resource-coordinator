output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.db.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.db.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.db.name
}

output "service_discovery_arn" {
  description = "ARN of the service discovery service"
  value       = aws_service_discovery_service.db.arn
}

output "db_host" {
  description = "Database host (service discovery DNS)"
  value       = "db.${var.cluster_name}.local"
}
