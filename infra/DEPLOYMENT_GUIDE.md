# ECR and Application Infrastructure - Deployment Guide

## Overview

The infrastructure is now split into two separate Terraform configurations:

1. **`terraform-ecr/`** - ECR container registries (persistent)
2. **`terraform/`** - Application infrastructure (can be destroyed/recreated)

This separation ensures your container images are never deleted when you tear down the application.

## First Time Setup

### Step 1: Setup ECR Repositories (One-time)

```bash
cd infra/terraform-ecr
terraform init
terraform plan
terraform apply
```

Or use the helper script:
```bash
./infra/scripts/setup-ecr.sh
```

**Output**: ECR repository URLs for api_service, frontend, suv_ui, mayday-db

### Step 2: Build and Push Container Images

```bash
cd /Users/kajetanp/Documents/AAU\ CE/code/mday/mayday-resource-coordinator
./infra/scripts/push-to-ecr.sh
```

### Step 3: Deploy Application Infrastructure

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## Daily Operations

### Start/Deploy Application

```bash
cd infra/terraform
terraform apply
```

### Stop/Destroy Application (keeps ECR images)

```bash
cd infra/terraform
terraform destroy
```

**Result**: Application infrastructure is destroyed, but ECR images remain intact.

### Update Container Images

```bash
# Make code changes
./infra/scripts/push-to-ecr.sh

# Force ECS service update
aws ecs update-service \
  --cluster mayday-cluster \
  --service mayday-cluster-api-service \
  --force-new-deployment \
  --region eu-central-1
```

### Update Infrastructure

```bash
# Make changes to terraform files
cd infra/terraform
terraform plan
terraform apply
```

## Managing ECR Repositories

### View ECR Repositories

```bash
cd infra/terraform-ecr
terraform output
```

### Update ECR Configuration

```bash
cd infra/terraform-ecr
# Make changes to main.tf
terraform plan
terraform apply
```

### Destroy ECR (⚠️ Deletes all images!)

```bash
cd infra/terraform-ecr
terraform destroy
```

**Warning**: This will delete ALL container images. Only do this if you're sure!

## Terraform State Files

Two separate state files:
- `mayday/ecr.tfstate` - ECR repositories
- `mayday/terraform.tfstate` - Application infrastructure

Both stored in S3 bucket: `mayday-terraform-state-390299133544`

## Common Workflows

### Clean Slate Deployment

```bash
# 1. Ensure ECR exists
cd infra/terraform-ecr
terraform apply

# 2. Build fresh images
cd ../..
./infra/scripts/push-to-ecr.sh

# 3. Deploy infrastructure
cd infra/terraform
terraform apply
```

### Quick Teardown (Saves Costs)

```bash
# Destroy application (keeps images)
cd infra/terraform
terraform destroy

# Later, redeploy quickly
terraform apply
```

### Complete Cleanup (Everything)

```bash
# 1. Destroy application
cd infra/terraform
terraform destroy

# 2. Destroy ECR (deletes images!)
cd ../terraform-ecr
terraform destroy
```

## Cost Optimization

### Development Pattern
- Deploy during work hours
- Destroy overnight
- ECR images remain, so redeployment is fast

### Production Pattern
- Keep application running
- Use autoscaling to manage costs
- ECR lifecycle policy keeps last 10 images

## Troubleshooting

### ECR repositories don't exist
```bash
cd infra/terraform-ecr
terraform apply
```

### Application can't find images
```bash
# Check ECR repositories exist
aws ecr describe-repositories --region eu-central-1

# Rebuild and push images
./infra/scripts/push-to-ecr.sh
```

### State lock errors
```bash
# Check DynamoDB locks
aws dynamodb scan --table-name mayday-terraform-locks --region eu-central-1

# Force unlock (use carefully!)
terraform force-unlock <lock-id>
```

## Benefits of This Setup

✅ **Safe teardown**: Destroy application without losing images
✅ **Fast redeployment**: Images already in ECR
✅ **Cost control**: Turn off expensive compute when not needed
✅ **Independent lifecycles**: Update app without touching registries
✅ **Image history**: Keep multiple versions in ECR

## Next Steps

1. ✅ Setup ECR repositories
2. ✅ Build and push images
3. ✅ Deploy application
4. ⏭️ Configure monitoring and alarms
5. ⏭️ Setup CI/CD pipelines
6. ⏭️ Add database backups
