# ECR Repository Outputs
output "ecr_repository_urls" {
  description = "Map of ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "ecr_repository_arns" {
  description = "Map of ECR repository ARNs"
  value       = module.ecr.repository_arns
}

output "api_service_repository_url" {
  description = "URL of the API service ECR repository"
  value       = module.ecr.repository_urls["api_service"]
}

output "frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = module.ecr.repository_urls["frontend"]
}

output "suv_ui_repository_url" {
  description = "URL of the SUV UI ECR repository"
  value       = module.ecr.repository_urls["suv_ui"]
}

# Lambda Outputs
output "lambda_ecs_control_arn" {
  description = "ARN of the ECS control Lambda function"
  value       = module.mayday_control_api.lambda_function_arn
}

output "lambda_ecs_control_name" {
  description = "Name of the ECS control Lambda function"
  value       = module.mayday_control_api.lambda_function_name
}

output "lambda_auth_arn" {
  description = "ARN of the auth Lambda function"
  value       = module.mayday_control_api.lambda_auth_arn
}

output "lambda_auth_name" {
  description = "Name of the auth Lambda function"
  value       = module.mayday_control_api.lambda_auth_name
}

output "lambda_status_arn" {
  description = "ARN of the cluster status Lambda function"
  value       = module.mayday_control_api.lambda_status_arn
}

output "lambda_status_name" {
  description = "Name of the cluster status Lambda function"
  value       = module.mayday_control_api.lambda_status_name
}

output "lambda_role_arn" {
  description = "ARN of the shared Lambda execution role"
  value       = module.mayday_control_api.lambda_role_arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the shared CloudWatch log group for all Lambda functions and API Gateway"
  value       = module.mayday_control_api.cloudwatch_log_group_name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the shared CloudWatch log group for all Lambda functions and API Gateway"
  value       = module.mayday_control_api.cloudwatch_log_group_arn
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = module.mayday_control_api.api_gateway_id
}

output "api_gateway_endpoint" {
  description = "URL of the API Gateway endpoint"
  value       = module.mayday_control_api.api_gateway_endpoint
}

output "api_gateway_stage" {
  description = "Name of the API Gateway stage"
  value       = module.mayday_control_api.api_gateway_stage
}

output "api_gateway_invoke_url" {
  description = "Full invoke URL for the API Gateway"
  value       = module.mayday_control_api.api_gateway_invoke_url
}

output "api_login_url" {
  description = "URL for login endpoint"
  value       = "${module.mayday_control_api.api_gateway_invoke_url}/login"
}

output "api_scale_url" {
  description = "URL for ECS scaling endpoint"
  value       = "${module.mayday_control_api.api_gateway_invoke_url}/scale"
}

# DynamoDB Outputs
output "admin_users_table_name" {
  description = "Name of the admin users DynamoDB table"
  value       = module.admin_portal.table_name
}

output "admin_users_table_arn" {
  description = "ARN of the admin users DynamoDB table"
  value       = module.admin_portal.table_arn
}

# Static Website Outputs
output "website_url" {
  description = "URL of the control panel website"
  value       = module.admin_portal.website_endpoint
}

output "website_bucket" {
  description = "Name of the website S3 bucket"
  value       = module.admin_portal.bucket_name
}