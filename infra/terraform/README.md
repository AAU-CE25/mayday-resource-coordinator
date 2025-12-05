# Mayday Resource Coordinator - Terraform Infrastructure

This directory contains the complete Infrastructure as Code (IaC) for deploying the Mayday Resource Coordinator to AWS ECS using Terraform.

## Architecture Overview

The infrastructure is organized into modular components:

- **ECR Module**: Container registries for Docker images (**managed separately in `../terraform-ecr/`**)
- **Common Infrastructure**: Shared resources (VPC, subnets, ALB, ECS cluster, IAM roles)
- **Database**: PostgreSQL database service
- **API Service**: FastAPI backend service
- **Frontend**: Next.js admin dashboard
- **SUV UI**: Next.js volunteer interface

## Important: ECR Managed Separately

⚠️ **ECR repositories are now managed separately** in `../terraform-ecr/` to ensure container images persist when the application infrastructure is destroyed/recreated.

**First-time setup:**
```bash
# 1. Setup ECR repositories (one-time)
cd ../terraform-ecr
terraform init
terraform apply

# 2. Build and push images
cd ../../
./infra/scripts/push-to-ecr.sh

# 3. Deploy application infrastructure
cd infra/terraform
terraform init
terraform apply
```

## Directory Structure

```
terraform/
├── main.tf                    # Root configuration - instantiates all modules
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars          # Variable values (gitignored)
├── README.md                  # This file
└── modules/
    ├── ecr/                   # Container registry module
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── README.md
    ├── common/                # Shared infrastructure module
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── README.md
    ├── database/              # PostgreSQL database module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── api_service/           # API service module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── frontend/              # Frontend module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── suv_ui/                # SUV UI module
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Prerequisites

1. **AWS Account**: AWS account ID: `390299133544`
2. **AWS CLI**: Configured with appropriate credentials
3. **Terraform**: Version >= 1.0
4. **IAM Permissions**: Use the policies in `../infra/iam-policies/`

## Quick Start

### 1. Configure Variables

Create a `terraform.tfvars` file with your configuration:

```hcl
aws_account_id    = "390299133544"
aws_region        = "eu-central-1"
cluster_name      = "mayday-cluster"

# Database credentials
postgres_user     = "postgres"
postgres_password = "your-secure-password"
postgres_db       = "mayday"

# Network configuration
vpc_cidr         = "10.0.0.0/16"
subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24"]

# Tags
tags = {
  Project   = "Mayday"
  ManagedBy = "Terraform"
}
```

**Important**: Never commit `terraform.tfvars` to version control.

### 2. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This single command deploys:
- ECR repositories for all container images
- VPC, subnets, internet gateway, route tables, NAT gateway
- Security group with required ports
- Application Load Balancer with target groups for all services
- ECS cluster
- IAM roles for task execution
- Service Discovery namespace
- PostgreSQL database service (in private subnet)
- API service with ALB integration and autoscaling
- Frontend service with ALB integration and autoscaling
- SUV UI service with ALB integration and autoscaling

### 3. Get Output Values

```bash
terraform output
```

Key outputs:
- `api_url`: Public URL for the API (via ALB)
- `ecr_repository_urls`: Map of all ECR repository URLs
- `ecr_api_repository_url`: ECR repository for API images
- `ecr_frontend_repository_url`: ECR repository for frontend images
- `ecr_suv_ui_repository_url`: ECR repository for SUV UI images
- `ecr_database_repository_url`: ECR repository for database images

## Module Details

### Common Module

Creates shared infrastructure:
- VPC with Internet Gateway (10.0.0.0/16)
- 2 public subnets across availability zones
- Security group (ports: 80, 3000, 3030, 5432, 8000)
- Application Load Balancer
- ECS cluster
- IAM roles for task execution
- Service Discovery namespace (`mayday-cluster.local`)

### Database Module

Deploys PostgreSQL 18 database:
- ECS task definition and service
- Service discovery: `db.mayday-cluster.local:5432`
- CloudWatch log group

### API Service Module

Deploys FastAPI backend:
- ECR repository
- ECS task definition and service
- ALB integration (public HTTP access on port 80)
- Service discovery: `api.mayday-cluster.local:8000`
- CloudWatch log group

### Frontend Module

Deploys Next.js admin dashboard:
- ECR repository
- ECS task definition and service
- Service discovery: `frontend.mayday-cluster.local:3000`
- CloudWatch log group

**Note**: Requires `NEXT_PUBLIC_API_URL` at build time.

**Configuration**: Requires `basePath: '/dashboard'` in `next.config.ts`

### SUV UI Module

Deploys Next.js volunteer interface:
- ECR repository
- ECS task definition and service
- Service discovery: `suv-ui.mayday-cluster.local:3030`
- CloudWatch log group
- Environment variable: `PORT=3030` (set in task definition)

**Note**: Requires `NEXT_PUBLIC_API_URL` at build time (must include protocol).

**Configuration**: Requires `basePath: '/suv'` in `next.config.ts`

## CI/CD Integration

The infrastructure integrates with GitHub Actions workflows:

1. **setup-infrastructure.yml**: Creates/updates infrastructure
2. **deploy-to-ecr.yml**: Builds and pushes Docker images
3. **deploy-to-ecs.yml**: Updates ECS services with new images

### Required GitHub Secrets and Variables

**Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCESS_KEY_ID_KAJ`
- `AWS_SECRET_ACCESS_KEY_KAJ`
- `POSTGRES_PASSWORD`

**Variables:**
- `AWS_ACCOUNT_ID`: `390299133544`
- `AWS_ACCOUNT_ID_KAJ`: `390299133544`
- `AWS_REGION`: `eu-central-1`
- `API_URL`: Full URL with protocol (e.g., `http://your-alb.amazonaws.com`)

## Accessing Services

### API Service
- **Public**: `http://<alb-dns-name>` (from `terraform output api_url`)
- **Internal**: `http://api.mayday-cluster.local:8000`

### Database
- **Internal only**: `db.mayday-cluster.local:5432`

### Frontend
- **Public**: `http://<alb-dns-name>/dashboard` (via ALB path routing)
- **Internal**: `http://frontend.mayday-cluster.local:3000`

### SUV UI
- **Public**: `http://<alb-dns-name>/suv` (via ALB path routing)
- **Internal**: `http://suv-ui.mayday-cluster.local:3030`

## Network Architecture

```
Internet
   │
   ▼
Internet Gateway
   │
   ▼
VPC (10.0.0.0/16)
├── Subnet 1 (10.0.1.0/24) - AZ a
├── Subnet 2 (10.0.2.0/24) - AZ b
│
├── ALB (Port 80) ──► API Service (Port 8000)
│                        │
├── Frontend (3000)      ▼
├── SUV UI (3030)     Database (5432)
│
└── Service Discovery: mayday-cluster.local
```

## Maintenance

### Update Infrastructure

```bash
# Make changes to .tf files
terraform plan
terraform apply
```

### Destroy Infrastructure

⚠️ **Warning**: This will delete all resources and data!

```bash
terraform destroy
```

### Refresh State

```bash
terraform refresh
terraform output
```

## Troubleshooting

### Terraform init fails
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions

### Plan shows unwanted changes
- Review `terraform.tfvars`
- Check for manual changes in AWS console

### Apply fails with IAM errors
- Apply IAM policies from `../infra/iam-policies/`
- Ensure CreateServiceLinkedRole permission exists

### Services can't connect to database
- Check service discovery: `db.mayday-cluster.local`
- Verify security group rules allow port 5432

### Frontend can't reach API
- Verify `NEXT_PUBLIC_API_URL` set at build time
- Rebuild Docker images if ALB DNS changed

## Cost Estimate

Current configuration:
- 4 ECS Fargate tasks (512 CPU, 1024 MB each)
- 1 Application Load Balancer
- 4 CloudWatch log groups
- 3 ECR repositories

**Estimated monthly cost**: ~$50-80 USD

## Best Practices

1. **State Management**: Use S3 backend for production (commented in main.tf)
2. **Secrets**: Migrate to AWS Secrets Manager
3. **Modules**: Each module is self-contained and reusable
4. **Variables**: Use `.tfvars` for environment-specific values
5. **Dependencies**: Explicit module dependencies ensure correct order

## Next Steps

1. Configure S3 backend for remote state
2. Add auto-scaling policies
3. Implement CloudWatch alarms
4. Add database backup strategy
5. Configure HTTPS with ACM certificate
6. Add WAF rules for security

## Support

For detailed information:
- Check module README files
- Review GitHub Actions workflow logs
- Check CloudWatch logs: `/ecs/mayday-cluster/<service>`
- Verify IAM policies in `../infra/iam-policies/`
