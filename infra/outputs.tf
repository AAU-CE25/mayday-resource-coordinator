output "ecr_api_repo_url" {
  value = aws_ecr_repository.api_repo.repository_url
}

output "ecr_db_repo_url" {
  value = aws_ecr_repository.db_repo.repository_url
}
