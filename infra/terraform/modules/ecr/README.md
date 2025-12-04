# ECR Module

This module manages AWS Elastic Container Registry (ECR) repositories for the Mayday application.

## Purpose

Creates and manages ECR repositories for:
- `mayday-api` - Backend API service
- `mayday-frontend` - Frontend web application
- `mayday-suv-ui` - SUV UI application
- `mayday-db` - PostgreSQL database

## Features

- **Automatic Image Scanning**: Scans images on push for vulnerabilities
- **Lifecycle Management**: Automatically keeps only the last N images (default: 10)
- **Encryption**: AES256 encryption at rest
- **Access Control**: Repository policies for ECS task access

## Usage

```hcl
module "ecr" {
  source = "./modules/ecr"

  repository_names = [
    "mayday-api",
    "mayday-frontend",
    "mayday-suv-ui",
    "mayday-db"
  ]

  image_tag_mutability            = "MUTABLE"
  scan_on_push                    = true
  lifecycle_policy_max_image_count = 10

  tags = var.tags
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| repository_names | List of ECR repository names to create | list(string) | n/a | yes |
| image_tag_mutability | Tag mutability setting (MUTABLE or IMMUTABLE) | string | "MUTABLE" | no |
| scan_on_push | Enable image scanning on push | bool | true | no |
| lifecycle_policy_max_image_count | Maximum number of images to keep | number | 10 | no |
| tags | Tags to apply to all resources | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| repository_urls | Map of repository names to URLs |
| repository_arns | Map of repository names to ARNs |
| api_repository_url | ECR repository URL for API service |
| frontend_repository_url | ECR repository URL for Frontend service |
| suv_ui_repository_url | ECR repository URL for SUV UI service |
| database_repository_url | ECR repository URL for Database service |

## Pushing Images

After creating the repositories, authenticate and push images:

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 390299133544.dkr.ecr.eu-central-1.amazonaws.com

# Build and push API image
docker build -t mayday-api:latest ./api_service
docker tag mayday-api:latest 390299133544.dkr.ecr.eu-central-1.amazonaws.com/mayday-api:latest
docker push 390299133544.dkr.ecr.eu-central-1.amazonaws.com/mayday-api:latest

# Similar for other services...
```

## Lifecycle Policy

The module automatically configures a lifecycle policy to:
- Keep only the last 10 images (configurable)
- Delete older images automatically
- Applies to all tags

This helps manage storage costs and keeps repositories clean.

## Security

- **Encryption**: All images are encrypted at rest using AES256
- **Scanning**: Images are automatically scanned for vulnerabilities on push
- **Access Control**: Repository policies restrict access to ECS tasks only
- **IAM Policies**: Additional IAM policies can be added via the repository_policy resource
