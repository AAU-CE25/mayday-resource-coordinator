terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mayday-terraform-state-390299133544"
    key            = "mayday/core/terraform.tfstate"
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

# ============================================
# Modules
# ============================================

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

module "ecr" {
  source = "./modules/ecr"

  repositories                     = local.repositories
  image_tag_mutability             = var.image_tag_mutability
  scan_on_push                     = var.scan_on_push
  lifecycle_policy_max_image_count = var.lifecycle_policy_max_image_count
  tags                             = var.tags
}

module "control_service" {
    source = "./modules/control-service"

    lambda_function_name = var.lambda_function_name
    lambda_source_path   = var.lambda_source_path
    aws_region          = var.aws_region
    tags                = var.tags
}

module "static_website" {
  source = "./modules/static-website"

  bucket_name     = "${var.lambda_function_name}-website"
  index_html_path = "../../control_service/static/index.html"
  tags            = var.tags
}