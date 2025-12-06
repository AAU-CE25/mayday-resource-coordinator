output "repository_urls" {
  description = "Map of all ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "api_repository_url" {
  description = "ECR repository URL for API service"
  value       = module.ecr.api_repository_url
}

output "frontend_repository_url" {
  description = "ECR repository URL for Frontend service"
  value       = module.ecr.frontend_repository_url
}

output "suv_ui_repository_url" {
  description = "ECR repository URL for SUV UI service"
  value       = module.ecr.suv_ui_repository_url
}

output "database_repository_url" {
  description = "ECR repository URL for Database service"
  value       = module.ecr.database_repository_url
}
