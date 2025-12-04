variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "Mayday"
    Environment = "production"
    ManagedBy   = "Terraform"
    Component   = "ECR"
  }
}
