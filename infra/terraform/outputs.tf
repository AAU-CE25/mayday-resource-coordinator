output "vpc_id" {
  description = "ID of the VPC"
  value       = module.common.vpc_id
}

output "subnet_ids" {
  description = "IDs of the subnets"
  value       = module.common.subnet_ids
}

output "security_group_id" {
  description = "ID of the security group"
  value       = module.common.security_group_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.common.alb_dns_name
}

output "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  value       = module.common.alb_target_group_arn
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.common.ecs_cluster_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.common.ecs_cluster_name
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = module.common.ecs_task_execution_role_arn
}

output "service_discovery_namespace_id" {
  description = "ID of the service discovery namespace"
  value       = module.common.service_discovery_namespace_id
}

output "api_url" {
  description = "URL for accessing the API"
  value       = "http://${module.common.alb_dns_name}"
}

# Database outputs
output "database_service_name" {
  description = "Name of the database ECS service"
  value       = module.database.service_name
}

output "database_host" {
  description = "Database host for internal connections"
  value       = module.database.db_host
}

# API Service outputs
output "api_service_name" {
  description = "Name of the API ECS service"
  value       = module.api_service.service_name
}

# Frontend outputs
output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = module.frontend.service_name
}


# SUV UI outputs
output "suv_ui_service_name" {
  description = "Name of the SUV UI ECS service"
  value       = module.suv_ui.service_name
}


