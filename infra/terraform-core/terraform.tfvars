lambda_function_name            = "mayday-control-api"
lambda_source_path              = "../../control_service/mayday-control-api"
aws_region                      = "eu-central-1"
image_tag_mutability            = "MUTABLE"
scan_on_push                    = true
lifecycle_policy_max_image_count = 10

tags = {
  Project     = "MayDay"
  Environment = "production"
  ManagedBy   = "Terraform"
  Cluster     = "Core"
}
