output "repository_urls" {
  description = "Map of all ECR repository URLs"
  value = {
    for k, repo in aws_ecr_repository.repositories : k => repo.repository_url
  }
}

output "repository_arns" {
  description = "Map of all ECR repository ARNs"
  value = {
    for k, repo in aws_ecr_repository.repositories : k => repo.arn
  }
}

output "api_repository_url" {
  description = "ECR repository URL for API service"
  value       = aws_ecr_repository.repositories["api_service"].repository_url
}

output "frontend_repository_url" {
  description = "ECR repository URL for Frontend service"
  value       = aws_ecr_repository.repositories["frontend"].repository_url
}

output "suv_ui_repository_url" {
  description = "ECR repository URL for SUV UI service"
  value       = aws_ecr_repository.repositories["suv_ui"].repository_url
}

output "database_repository_url" {
  description = "ECR repository URL for Database service"
  value       = aws_ecr_repository.repositories["database"].repository_url
}
