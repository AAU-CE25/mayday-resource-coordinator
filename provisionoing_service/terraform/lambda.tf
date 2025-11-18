# Create IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lambda_test_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Principal = { Service = "lambda.amazonaws.com" },
      Effect = "Allow"
    }]
  })
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function
resource "aws_lambda_function" "provisioning_service" {
  function_name = "provisioning_service_test"
  role          = aws_iam_role.lambda_role.arn
  handler       = "controller.lambda_handler"
  runtime       = "python3.11"
  filename      = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  timeout       = 10
}

output "lambda_name" {
  value = aws_lambda_function.provisioning_service.function_name
}
