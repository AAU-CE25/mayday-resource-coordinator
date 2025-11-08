# Basic project info
project_name   = "mday"
aws_region     = "eu-central-1"

# Deployment toggle
app_active     = true  # false will disable ECS + ALB

# ECS task resources
ecs_task_cpu    = 256
ecs_task_memory = 512

# ECR image tags
api_image_tag = "v0.0.1"
db_image_tag  = "v0.0.1"

# Networking
vpc_id   = "vpc-0abcd1234efgh5678"
subnets  = ["subnet-0aaa1111bbb2222", "subnet-0ccc3333ddd4444"]

# Non-sensitive variables (safe to keep here)
db_user  = "admin"

# Sensitive variables (DO NOT store in tfvars — inject via CI/CD)
# db_password  = "supersecret"    <-- pass via GitHub Action secrets
# jwt_secret   = "myjwtsecret"    <-- pass via GitHub Action secrets
