output "website_endpoint" {
  description = "S3 website endpoint URL"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}


output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

data "aws_region" "current" {}

output "table_name" {
  description = "Name of the DynamoDB admin users table"
  value       = aws_dynamodb_table.admin_users.name
}

output "table_arn" {
  description = "ARN of the DynamoDB admin users table"
  value       = aws_dynamodb_table.admin_users.arn
}

output "table_id" {
  description = "ID of the DynamoDB admin users table"
  value       = aws_dynamodb_table.admin_users.id
}
