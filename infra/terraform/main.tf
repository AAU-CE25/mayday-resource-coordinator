terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for remote state storage
  # Before using this, create the S3 bucket and DynamoDB table:
  # 1. Create S3 bucket: aws s3 mb s3://mayday-terraform-state-390299133544 --region eu-central-1
  # 2. Enable versioning: aws s3api put-bucket-versioning --bucket mayday-terraform-state-390299133544 --versioning-configuration Status=Enabled
  # 3. Enable encryption: aws s3api put-bucket-encryption --bucket mayday-terraform-state-390299133544 --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  # 4. Block public access: aws s3api put-public-access-block --bucket mayday-terraform-state-390299133544 --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  # 5. Create DynamoDB table: aws dynamodb create-table --table-name mayday-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region eu-central-1
  # 6. Run: terraform init -migrate-state
  backend "s3" {
    bucket         = "mayday-terraform-state-390299133544"
    key            = "mayday/terraform.tfstate"
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

# Note: ECR repositories are managed separately in ../terraform-ecr/
# This ensures container images persist when the application is destroyed/recreated

# Common Infrastructure Module
module "common" {
  source = "./modules/common"

  cluster_name         = var.cluster_name
  aws_region           = var.aws_region
  vpc_cidr             = var.vpc_cidr
  subnet_cidrs         = var.subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags                 = var.tags
}

# Database Module
module "database" {
  source = "./modules/database"

  cluster_name                   = var.cluster_name
  ecs_cluster_id                 = module.common.cluster_id
  task_execution_role_arn        = module.common.task_execution_role_arn
  subnet_ids                     = module.common.private_subnets # Use private subnets for database
  security_group_id              = module.common.security_group_id
  service_discovery_namespace_id = module.common.service_discovery_namespace_id
  postgres_user                  = var.postgres_user
  postgres_password              = var.postgres_password
  postgres_db                    = var.postgres_db
  aws_region                     = var.aws_region
  tags                           = var.tags
}

# API Service Module
module "api_service" {
  source = "./modules/api_service"

  cluster_name                   = var.cluster_name
  ecs_cluster_id                 = module.common.cluster_id
  task_execution_role_arn        = module.common.task_execution_role_arn
  subnet_ids                     = module.common.subnets
  security_group_id              = module.common.security_group_id
  service_discovery_namespace_id = module.common.service_discovery_namespace_id
  alb_target_group_arn           = module.common.alb_target_group_arn
  aws_account_id                 = var.aws_account_id
  aws_region                     = var.aws_region
  db_host                        = module.database.db_host
  postgres_user                  = var.postgres_user
  postgres_password              = var.postgres_password
  postgres_db                    = var.postgres_db
  tags                           = var.tags

  depends_on = [module.database]
}

# Frontend Module
module "frontend" {
  source = "./modules/frontend"

  cluster_name                   = var.cluster_name
  ecs_cluster_id                 = module.common.cluster_id
  task_execution_role_arn        = module.common.task_execution_role_arn
  subnet_ids                     = module.common.subnets
  security_group_id              = module.common.security_group_id
  service_discovery_namespace_id = module.common.service_discovery_namespace_id
  alb_target_group_arn           = module.common.alb_frontend_target_group_arn
  aws_account_id                 = var.aws_account_id
  aws_region                     = var.aws_region
  api_url                        = "http://${module.common.alb_dns_name}"
  tags                           = var.tags
}

# SUV UI Module
module "suv_ui" {
  source = "./modules/suv_ui"

  cluster_name                   = var.cluster_name
  ecs_cluster_id                 = module.common.cluster_id
  task_execution_role_arn        = module.common.task_execution_role_arn
  subnet_ids                     = module.common.subnets
  security_group_id              = module.common.security_group_id
  service_discovery_namespace_id = module.common.service_discovery_namespace_id
  alb_target_group_arn           = module.common.alb_suv_ui_target_group_arn
  aws_account_id                 = var.aws_account_id
  aws_region                     = var.aws_region
  api_url                        = "http://${module.common.alb_dns_name}"
  tags                           = var.tags
}
