# ECR Infrastructure - Standalone Stack

This directory contains the Terraform configuration for Amazon ECR (Elastic Container Registry) repositories. This is a **standalone infrastructure stack** managed independently from the main application infrastructure.

## Architecture

This stack creates:
- **3 ECR Repositories** for container images
- **Lifecycle policies** to automatically manage image retention
- **Image scanning** enabled by default for security
- **AES256 encryption** for all repositories 

## Why Separate?

ECR repositories are managed separately from the main application infrastructure to ensure:

- ✅ **Container images persist** when the application is destroyed/recreated
- ✅ **Faster teardown/recreation** of application resources
- ✅ **Independent lifecycle management** for container registries
- ✅ **Separate state file** prevents accidental deletion

## Repositories

| Repository | Purpose | Used By |
|------------|---------|---------|
| `api_service` | FastAPI backend service | API ECS Service |
| `frontend` | Next.js dashboard UI | Frontend ECS Service |
| `suv_ui` | Next.js volunteer portal | SUV UI ECS Service |

## Usage

### Initial Setup

```bash
cd infra/terraform-ecr
terraform init
terraform plan
terraform apply
```

### View Repository URLs

```bash
terraform output
terraform output -json repository_urls
```

### Update Configuration

```bash
terraform plan
terraform apply
```

## Configuration

Edit `variables.tf` or pass via command line:

```bash
terraform apply \
  -var="lifecycle_policy_max_image_count=20" \
  -var="image_tag_mutability=IMMUTABLE"
```

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `eu-central-1` | AWS region for ECR repositories |
| `image_tag_mutability` | `MUTABLE` | Allow tag overwrites (MUTABLE/IMMUTABLE) |
| `scan_on_push` | `true` | Scan images for vulnerabilities on push |
| `lifecycle_policy_max_image_count` | `10` | Maximum images to retain per repository |

## Lifecycle Policy

- **Retention**: Keeps the last 10 images (configurable)
- **Cleanup**: Automatically deletes older images
- **Tag Status**: Applies to all images (tagged and untagged)

## Security Features

- ✅ **Encryption at rest** (AES256)
- ✅ **Vulnerability scanning** on push
- ✅ **IAM-based access control**
- ✅ **Resource tagging** for governance

## State Management

- **Backend**: S3 bucket `mayday-terraform-state-390299133544`
- **State Key**: `mayday/ecr.tfstate`
- **Locking**: DynamoDB table `mayday-terraform-locks`
- **Separate from main app state** to prevent accidental deletion

## GitHub Actions

This stack can be deployed via the `terraform-ecr.yml` workflow:

```bash
# Manual trigger
gh workflow run terraform-ecr.yml -f action=plan
gh workflow run terraform-ecr.yml -f action=apply
```

**Automatic triggers:**
- Push to `main`, `staging`, or feature branches
- Changes to `infra/terraform-ecr/**`
- Changes to workflow file

## Important Notes

⚠️ **Do NOT destroy this infrastructure** unless you want to delete all container images and their history.

- ECR repositories are shared across all environments
- Deleting repositories removes all images permanently
- Always backup critical images before destroying
- Consider using `terraform state rm` to remove from state without deleting

## Outputs

After `terraform apply`, you'll get:

```json
{
  "repository_urls": {
    "api_service": "390299133544.dkr.ecr.eu-central-1.amazonaws.com/api_service",
    "frontend": "390299133544.dkr.ecr.eu-central-1.amazonaws.com/frontend",
    "suv_ui": "390299133544.dkr.ecr.eu-central-1.amazonaws.com/suv_ui",
  }
}
```

## Integration with Main Infrastructure

The main Terraform stack (`infra/terraform/`) references these ECR repositories by URL. The repositories must be created before deploying the main application infrastructure.

**Deployment Order:**
1. ✅ Deploy ECR stack (this)
2. ✅ Push Docker images to ECR
3. ✅ Deploy main infrastructure

## Troubleshooting

### Error: Repository already exists
If repositories already exist, import them:
```bash
terraform import 'aws_ecr_repository.repositories["api_service"]' api_service
terraform import 'aws_ecr_repository.repositories["frontend"]' frontend
terraform import 'aws_ecr_repository.repositories["suv_ui"]' suv_ui
```

### Error: No images found
Push images after creating repositories:
```bash
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 390299133544.dkr.ecr.eu-central-1.amazonaws.com
docker tag my-image:latest 390299133544.dkr.ecr.eu-central-1.amazonaws.com/api_service:latest
docker push 390299133544.dkr.ecr.eu-central-1.amazonaws.com/api_service:latest
```
