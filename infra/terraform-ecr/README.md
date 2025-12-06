# ECR Infrastructure

This directory contains the Terraform configuration for Amazon ECR (Elastic Container Registry) repositories. 

## Why Separate?

ECR repositories are managed separately from the main application infrastructure to ensure:
- **Container images persist** when the application is destroyed/recreated
- **Faster teardown/recreation** of application resources
- **Independent lifecycle management** for container registries

## Usage

### Initial Setup

```bash
cd infra/terraform-ecr
terraform init
terraform plan
terraform apply
```

### Viewing Repositories

```bash
terraform output
```

## Important Notes

- **Do NOT destroy this infrastructure** unless you want to delete all container images
- ECR repositories are shared across all environments
- Images are retained based on lifecycle policy (keeps last 10 images)
- State is stored separately in S3: `mayday/ecr.tfstate`

## Repositories Created

1. `api_service` - FastAPI backend service
2. `frontend` - Next.js dashboard UI
3. `suv_ui` - Next.js volunteer UI
4. `mayday-db` - PostgreSQL database (if custom image needed)

## Lifecycle Policy

- Maximum 10 images kept per repository
- Older images are automatically deleted
- Images are scanned on push for vulnerabilities
