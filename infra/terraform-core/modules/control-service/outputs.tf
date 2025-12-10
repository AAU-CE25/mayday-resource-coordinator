output "lambda_function_arn" {
  description = "ARN of the ECS control Lambda function"
  value       = aws_lambda_function.ecs_control.arn
}

output "lambda_function_name" {
  description = "Name of the ECS control Lambda function"
  value       = aws_lambda_function.ecs_control.function_name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_log_group" {
  description = "CloudWatch Log Group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.ecs_control.id
}

output "api_gateway_endpoint" {
  description = "URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.ecs_control.api_endpoint
}

output "api_gateway_stage" {
  description = "Name of the API Gateway stage"
  value       = aws_apigatewayv2_stage.default.name
}

output "api_gateway_invoke_url" {
  description = "Full invoke URL for the API Gateway"
  value       = "${aws_apigatewayv2_api.ecs_control.api_endpoint}/${aws_apigatewayv2_stage.default.name}"
}
