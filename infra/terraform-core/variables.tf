variable "lambda_function_name" {
  description = "Name of the MayDay control Lambda function"
  type        = string
  default     = "mayday-control-api"
}

variable "lambda_source_path" {
  description = "Path to the Lambda function source code"
  type        = string
  default     = "../../control_service/mayday-control-api"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "image_tag_mutability" {
  description = "The tag mutability setting for the ECR repositories"
  type        = string
  default     = "MUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "Valid values are MUTABLE or IMMUTABLE."
  }
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "lifecycle_policy_max_image_count" {
  description = "Maximum number of images to keep in each repository"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "MayDay"
    Environment = "production"
    ManagedBy   = "Terraform"
    Cluster     = "Core"
  }
}
