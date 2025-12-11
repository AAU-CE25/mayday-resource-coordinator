# ============================================
# Lambda IAM Role
# ============================================

resource "aws_iam_role" "lambda_role" {
  name = "${var.lambda_function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.lambda_function_name}-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:ListServices",
          "ecs:DescribeServices",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:ListClusters",
          "ecs:DescribeClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan"
        ]
        Resource = var.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.lambda_function_name}*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      }
    ]
  })
}

# ============================================
# CloudWatch Logs
# ============================================
# CloudWatch Log Groups
# ============================================

# Shared log group for all mayday-core components
resource "aws_cloudwatch_log_group" "mayday_core" {
  name              = "/aws/mayday-core/all"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# ============================================
# Lambda Functions
# ============================================

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = var.lambda_source_path
  output_path = "${path.module}/lambda_function.zip"
}

# ECS Control Lambda
resource "aws_lambda_function" "ecs_control" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.lambda_function_name}-ecs-scaling-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "ecs_scaling_handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.mayday_core.name
  }

  tags = var.tags

  depends_on = [
    aws_cloudwatch_log_group.mayday_core,
    aws_iam_role_policy.lambda_policy
  ]
}

# Authentication Lambda
resource "aws_lambda_function" "auth" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.lambda_function_name}-auth-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "auth_handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      USERS_TABLE = var.dynamodb_table_name
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.mayday_core.name
  }

  tags = var.tags

  depends_on = [
    aws_cloudwatch_log_group.mayday_core,
    aws_iam_role_policy.lambda_policy
  ]
}

# Cluster Status Lambda
resource "aws_lambda_function" "cluster_status" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.lambda_function_name}-cluster-status-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "cluster_status_handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.mayday_core.name
  }

  tags = var.tags

  depends_on = [
    aws_cloudwatch_log_group.mayday_core,
    aws_iam_role_policy.lambda_policy
  ]
}

# ============================================
# API Gateway
# ============================================

resource "aws_apigatewayv2_api" "mayday_control" {
  name          = "${var.lambda_function_name}-api"
  protocol_type = "HTTP"
  description   = "API Gateway for MayDay Control API"

  cors_configuration {
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = var.cors_allow_origins
    allow_headers = ["content-type", "authorization"]
  }

  tags = var.tags
}

##########################
# API Gateway Stage
##########################
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.mayday_control.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.mayday_core.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = var.tags
}

##########################
# Lambda Integrations
##########################
resource "aws_apigatewayv2_integration" "lambda_ecs" {
  api_id                 = aws_apigatewayv2_api.mayday_control.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.ecs_control.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "lambda_auth" {
  api_id                 = aws_apigatewayv2_api.mayday_control.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "lambda_status" {
  api_id                 = aws_apigatewayv2_api.mayday_control.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.cluster_status.invoke_arn
  payload_format_version = "2.0"
}

##########################
# API Gateway Authorizer
##########################
resource "aws_apigatewayv2_authorizer" "token_authorizer" {
  api_id           = aws_apigatewayv2_api.mayday_control.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = aws_lambda_function.auth.invoke_arn
  name             = "token-authorizer"
  identity_sources = ["$request.header.Authorization"]
  
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
}

##########################
# Routes
##########################

# Login route (no auth required)
resource "aws_apigatewayv2_route" "post_login" {
  api_id    = aws_apigatewayv2_api.mayday_control.id
  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_auth.id}"
}

# Cluster status route (auth required)
resource "aws_apigatewayv2_route" "get_status" {
  api_id             = aws_apigatewayv2_api.mayday_control.id
  route_key          = "GET /status"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_status.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.token_authorizer.id
}

# ECS control route (auth required)
resource "aws_apigatewayv2_route" "post_scale" {
  api_id             = aws_apigatewayv2_api.mayday_control.id
  route_key          = "POST /scale"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_ecs.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.token_authorizer.id
}

##########################
# Lambda Permissions
##########################
resource "aws_lambda_permission" "api_gateway_ecs" {
  statement_id  = "AllowAPIGatewayInvokeECS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ecs_control.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mayday_control.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_auth" {
  statement_id  = "AllowAPIGatewayInvokeAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mayday_control.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_status" {
  statement_id  = "AllowAPIGatewayInvokeStatus"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cluster_status.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mayday_control.execution_arn}/*/*"
}
