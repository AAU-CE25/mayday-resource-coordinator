terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: Configure S3 backend for state storage
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "mayday/terraform.tfstate"
  #   region = "eu-central-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Common Infrastructure Module
module "common" {
  source = "./modules/common"

  cluster_name = var.cluster_name
  aws_region   = var.aws_region
  vpc_cidr     = var.vpc_cidr
  subnet_cidrs = var.subnet_cidrs
  tags         = var.tags
}

# Database Module
module "database" {
  source = "./modules/database"

  cluster_name                    = var.cluster_name
  ecs_cluster_id                  = module.common.cluster_id
  task_execution_role_arn         = module.common.task_execution_role_arn
  subnet_ids                      = module.common.subnets
  security_group_id               = module.common.security_group_id
  service_discovery_namespace_id  = module.common.service_discovery_namespace_id
  postgres_user                   = var.postgres_user
  postgres_password               = var.postgres_password
  postgres_db                     = var.postgres_db
  aws_region                      = var.aws_region
  tags                            = var.tags
}

# API Service Module
module "api_service" {
  source = "./modules/api_service"

  cluster_name                    = var.cluster_name
  ecs_cluster_id                  = module.common.cluster_id
  task_execution_role_arn         = module.common.task_execution_role_arn
  subnet_ids                      = module.common.subnets
  security_group_id               = module.common.security_group_id
  service_discovery_namespace_id  = module.common.service_discovery_namespace_id
  alb_target_group_arn            = module.common.alb_target_group_arn
  aws_account_id                  = var.aws_account_id
  aws_region                      = var.aws_region
  db_host                         = module.database.db_host
  postgres_user                   = var.postgres_user
  postgres_password               = var.postgres_password
  postgres_db                     = var.postgres_db
  tags                            = var.tags

  depends_on = [module.database]
}

# Frontend Module
module "frontend" {
  source = "./modules/frontend"

  cluster_name                    = var.cluster_name
  ecs_cluster_id                  = module.common.cluster_id
  task_execution_role_arn         = module.common.task_execution_role_arn
  subnet_ids                      = module.common.subnets
  security_group_id               = module.common.security_group_id
  service_discovery_namespace_id  = module.common.service_discovery_namespace_id
  aws_account_id                  = var.aws_account_id
  aws_region                      = var.aws_region
  tags                            = var.tags
}

# SUV UI Module
module "suv_ui" {
  source = "./modules/suv_ui"

  cluster_name                    = var.cluster_name
  ecs_cluster_id                  = module.common.cluster_id
  task_execution_role_arn         = module.common.task_execution_role_arn
  subnet_ids                      = module.common.subnets
  security_group_id               = module.common.security_group_id
  service_discovery_namespace_id  = module.common.service_discovery_namespace_id
  aws_account_id                  = var.aws_account_id
  aws_region                      = var.aws_region
  tags                            = var.tags
}
