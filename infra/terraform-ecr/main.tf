terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for remote state storage (separate from main app state)
  backend "s3" {
    bucket         = "mayday-terraform-state-390299133544"
    key            = "mayday/ecr.tfstate"
    region         = "eu-central-1"
    encrypt        = true
    dynamodb_table = "mayday-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# ECR Module - Container Registry
# Creates ECR repositories for all application images
# This is managed separately to prevent deletion when app infrastructure is destroyed
module "ecr" {
  source = "../terraform/modules/ecr"

  repository_names = [
    "api_service",
    "frontend",
    "suv_ui",
    "mayday-db"
  ]

  image_tag_mutability             = "MUTABLE"
  scan_on_push                     = true
  lifecycle_policy_max_image_count = 10

  tags = var.tags
}
