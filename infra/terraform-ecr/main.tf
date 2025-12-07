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
    bucket = "mayday-terraform-state-390299133544"
    key    = "mayday/ecr.tfstate"
    region = "eu-central-1"

    # State locking via DynamoDB (shared with main infrastructure)
    dynamodb_table = "mayday-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Local values for repository configuration
locals {
  repositories = {
    api_service = {
      name        = "api_service"
      description = "FastAPI backend service"
    }
    frontend = {
      name        = "frontend"
      description = "Next.js dashboard UI"
    }
    suv_ui = {
      name        = "suv_ui"
      description = "Next.js volunteer portal UI"
    }
  }
}

# ECR Repositories
resource "aws_ecr_repository" "repositories" {
  for_each = local.repositories

  name                 = each.value.name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name        = each.value.name
    Description = each.value.description
  })
}

# Lifecycle Policy for each repository
resource "aws_ecr_lifecycle_policy" "repositories" {
  for_each   = aws_ecr_repository.repositories
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last ${var.lifecycle_policy_max_image_count} images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.lifecycle_policy_max_image_count
      }
      action = {
        type = "expire"
      }
    }]
  })
}
