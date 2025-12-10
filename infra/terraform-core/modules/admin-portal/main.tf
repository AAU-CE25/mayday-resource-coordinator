# S3 Bucket for static website
resource "aws_s3_bucket" "website" {
  bucket = var.bucket_name

  tags = var.tags
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  source       = var.index_html_path
  content_type = "text/html"
  etag         = filemd5(var.index_html_path)
}

# ============================================
# DynamoDB Table for Admin Users
# ============================================

resource "aws_dynamodb_table" "admin_users" {
  name           = var.table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "username"

  attribute {
    name = "username"
    type = "S"
  }

  tags = var.tags
}

