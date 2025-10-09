resource "aws_iam_role" "lambda_role" {
  name = "provisioning_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_lambda_function" "controller" {
  function_name = "provisioning_controller"
  handler       = "controller.lambda_handler"
  runtime       = "python3.11"
  role          = aws_iam_role.lambda_role.arn
  filename      = "lambda.zip" # Zip of lambda/ folder
  environment {
    variables = {
      USERS_TABLE   = aws_dynamodb_table.users.name
      VOLUMES_TABLE = aws_dynamodb_table.volumes.name
      ECS_CLUSTER   = aws_ecs_cluster.main.name
      TASK_DEFINITION = aws_ecs_task_definition.main.arn
      SUBNETS = join(",", aws_subnet.private.*.id)
    }
  }
}

# API Gateway integration
resource "aws_apigatewayv2_api" "api" {
  name          = "provisioning_api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.controller.invoke_arn
}
