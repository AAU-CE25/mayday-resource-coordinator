output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.suv_ui.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.suv_ui.arn
}

output "service_discovery_arn" {
  description = "ARN of the service discovery service"
  value       = aws_service_discovery_service.suv_ui.arn
}
