output "lambda_function_arn" {
  description = "ARN of the MayDay ECS control Lambda function"
  value       = aws_lambda_function.ecs_control.arn
}

output "lambda_function_name" {
  description = "Name of the MayDay ECS control Lambda function"
  value       = aws_lambda_function.ecs_control.function_name
}

output "lambda_auth_arn" {
  description = "ARN of the MayDay auth Lambda function"
  value       = aws_lambda_function.auth.arn
}

output "lambda_auth_name" {
  description = "Name of the MayDay auth Lambda function"
  value       = aws_lambda_function.auth.function_name
}

output "lambda_status_arn" {
  description = "ARN of the MayDay cluster status Lambda function"
  value       = aws_lambda_function.cluster_status.arn
}

output "lambda_status_name" {
  description = "Name of the MayDay cluster status Lambda function"
  value       = aws_lambda_function.cluster_status.function_name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the shared CloudWatch log group"
  value       = aws_cloudwatch_log_group.mayday_core.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the shared CloudWatch log group"
  value       = aws_cloudwatch_log_group.mayday_core.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.mayday_control.id
}

output "api_gateway_endpoint" {
  description = "URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.mayday_control.api_endpoint
}

output "api_gateway_stage" {
  description = "Name of the API Gateway stage"
  value       = aws_apigatewayv2_stage.default.name
}

output "api_gateway_invoke_url" {
  description = "Full invoke URL for the API Gateway"
  value       = "${aws_apigatewayv2_api.mayday_control.api_endpoint}/${aws_apigatewayv2_stage.default.name}"
}
