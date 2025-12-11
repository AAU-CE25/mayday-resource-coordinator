# MayDay Core Infrastructure

This Terraform configuration manages the **mayday-core** cluster, which provides:
- Core ECS cluster for control services
- ECR repositories for all container images (shared across all application clusters)
- ECS Control Lambda function (manages services across all clusters)
- Shared IAM roles for ECS task execution

## Architecture

```
┌──────────────────────────────────────────────────┐
│           mayday-core cluster                     │
├──────────────────────────────────────────────────┤
│  • ECS Cluster (mayday-core)                     │
│  • ECS Control Lambda                            │
│  • ECR Repositories                              │
│    - api_service                                 │
│    - frontend                                    │
│    - suv_ui                                      │
│    - control_service                             │
│  • IAM Task Execution Role (shared)              │
└──────────────────────────────────────────────────┘
                    ↓ manages & provides images
┌────────────────────────┐  ┌────────────────────┐
│ Application Cluster 1  │  │ Application Cluster 2 │
│ (custom name)          │  │ (custom name)        │
│  • Uses ECR images     │  │  • Uses ECR images   │
│  • Managed by Lambda   │  │  • Managed by Lambda │
└────────────────────────┘  └────────────────────┘
```

## Resources Created

### Core ECS Cluster
- **Cluster**: `mayday-core`
- **Capacity Providers**: Fargate, Fargate Spot
- **Container Insights**: Enabled
- **Purpose**: Hosts control services and management tools

### ECR Repositories
Central image registry for all clusters:
- `api_service` - FastAPI backend
- `frontend` - Next.js dashboard UI
- `suv_ui` - Next.js volunteer portal
- `control_service` - Orchestration service

**Features**:
- AES256 encryption
- Image scanning on push
- Lifecycle policy (keep last 10 images)
- Accessible from all ECS clusters

### Lambda Function
- **Name**: `mayday-ecs-control`
- **Runtime**: Python 3.11
- **Purpose**: Manage ECS services across all clusters
- **Operations**:
  - Scale services
  - Update task definitions
  - List services
  - Get metrics
- **Access**: HTTP Function URL

### IAM Roles
- **ECS Task Execution Role**: Shared across all clusters
- **Lambda Execution Role**: Full ECS and CloudWatch access

## Deployment

### Prerequisites

1. S3 backend bucket exists: `mayday-terraform-state-390299133544`
2. DynamoDB lock table exists: `mayday-terraform-locks`
3. Lambda source code at: `../../ecs_control_lambda/`

### Deploy Core Infrastructure

```bash
cd infra/terraform-core
terraform init
terraform plan
terraform apply
```

### View Outputs

```bash
terraform output                           # All outputs
terraform output -raw lambda_function_url  # Lambda endpoint
terraform output ecr_repository_urls       # All ECR URLs
terraform output -raw api_service_repository_url  # Specific repo
```

## Using ECR Repositories

### Build and Push Images

```bash
# Get repository URL
ECR_REPO=$(cd infra/terraform-core && \
  terraform output -raw api_service_repository_url)

# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  $(echo $ECR_REPO | cut -d'/' -f1)

# Build and push
docker build -t $ECR_REPO:latest -t $ECR_REPO:v1.0.0 .
docker push $ECR_REPO:latest
docker push $ECR_REPO:v1.0.0
```

### Reference in Application Clusters

```hcl
# In application cluster terraform
data "terraform_remote_state" "core" {
  backend = "s3"
  config = {
    bucket = "mayday-terraform-state-390299133544"
    key    = "mayday/core/terraform.tfstate"
    region = "eu-central-1"
  }
}

# Use ECR image URL
image = "${data.terraform_remote_state.core.outputs.api_service_repository_url}:latest"

# Use shared task execution role
task_execution_role_arn = data.terraform_remote_state.core.outputs.ecs_task_execution_role_arn
```

## Using Lambda Function

### Scale Service in Any Cluster

```bash
LAMBDA_URL=$(cd infra/terraform-core && \
  terraform output -raw lambda_function_url)

curl -X POST $LAMBDA_URL \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_name": "my-app-cluster",
    "service_name": "api_service",
    "desired_count": 3
  }'
```

### List Services

```bash
curl -X POST $LAMBDA_URL \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "get_services",
    "cluster_name": "my-app-cluster"
  }'
```

## Configuration

Edit `terraform.tfvars`:

```hcl
core_cluster_name               = "mayday-core"
lambda_function_name            = "mayday-ecs-control"
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
```

## Application Cluster Integration

Application clusters should reference core infrastructure:

```hcl
# Read core outputs
data "terraform_remote_state" "core" {
  backend = "s3"
  config = {
    bucket = "mayday-terraform-state-390299133544"
    key    = "mayday/core/terraform.tfstate"
    region = "eu-central-1"
  }
}

# Use in your resources
module "api_service" {
  source = "./modules/api_service"
  
  ecr_repository_url      = data.terraform_remote_state.core.outputs.api_service_repository_url
  task_execution_role_arn = data.terraform_remote_state.core.outputs.ecs_task_execution_role_arn
  # ... other variables
}
```

## Monitoring

### Lambda Logs

```bash
aws logs tail /aws/lambda/mayday-ecs-control --follow
```

### Core Cluster Status

```bash
aws ecs describe-clusters --clusters mayday-core
```

### ECR Images

```bash
aws ecr describe-images \
  --repository-name api_service \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]' \
  --output table
```

## State Management

- **Backend**: S3 bucket `mayday-terraform-state-390299133544`
- **State Key**: `mayday/core/terraform.tfstate`
- **Lock Table**: `mayday-terraform-locks`

Separate state ensures core infrastructure independence.

## Updating Lambda Code

After modifying `ecs_control_lambda/lambda_function.py`:

```bash
cd infra/terraform-core
terraform apply  # Automatically repackages and deploys
```

## Cleanup

⚠️ **Warning**: Destroying core infrastructure will affect all application clusters.

```bash
# First destroy all application clusters that depend on core
# Then destroy core
cd infra/terraform-core
terraform destroy
```

## Security Notes

- Lambda Function URL uses `NONE` authorization (development)
- For production: Change to `AWS_IAM` in `main.tf`
- ECR images are private, require AWS authentication
- Lambda has broad ECS permissions across all clusters

## Cost Considerations

- **ECS Cluster**: No cost (only running tasks are billed)
- **ECR**: Storage costs for images (~$0.10/GB/month)
- **Lambda**: Generous free tier (1M requests/month)
- **CloudWatch**: Minimal (7-day retention)

## Troubleshooting

### Cannot Pull from ECR
Verify task execution role has ECR access:
```bash
aws iam get-role-policy \
  --role-name mayday-core-task-execution-role \
  --policy-name ecr-access
```

### Lambda Cannot Find Cluster
Ensure cluster name is correct:
```bash
aws ecs list-clusters | grep mayday
```
