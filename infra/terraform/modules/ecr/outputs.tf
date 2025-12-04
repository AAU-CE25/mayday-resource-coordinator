output "repository_urls" {
  description = "Map of repository names to their URLs"
  value = {
    for name, repo in aws_ecr_repository.repositories :
    name => repo.repository_url
  }
}

output "repository_arns" {
  description = "Map of repository names to their ARNs"
  value = {
    for name, repo in aws_ecr_repository.repositories :
    name => repo.arn
  }
}

output "repository_registry_ids" {
  description = "Map of repository names to their registry IDs"
  value = {
    for name, repo in aws_ecr_repository.repositories :
    name => repo.registry_id
  }
}

output "api_repository_url" {
  description = "ECR repository URL for API service"
  value       = aws_ecr_repository.repositories["mayday-api"].repository_url
}

output "frontend_repository_url" {
  description = "ECR repository URL for Frontend service"
  value       = aws_ecr_repository.repositories["mayday-frontend"].repository_url
}

output "suv_ui_repository_url" {
  description = "ECR repository URL for SUV UI service"
  value       = aws_ecr_repository.repositories["mayday-suv-ui"].repository_url
}

output "database_repository_url" {
  description = "ECR repository URL for Database service"
  value       = aws_ecr_repository.repositories["mayday-db"].repository_url
}
