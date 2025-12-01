# ECR Pipeline - Build and Push Docker Images

This document describes the GitHub Actions workflow that builds and pushes Docker images to AWS Elastic Container Registry (ECR).

## Overview

**Workflow file:** `.github/workflows/deploy-to-ecr.yml`

The ECR pipeline automatically builds Docker images for modified services and pushes them to AWS ECR. It uses intelligent change detection to only build images for services that have been modified, saving build time and resources.

## Prerequisites

Before running this workflow, you must:

1. **Run the Infrastructure Setup workflow** (`setup-infrastructure.yml`) to create the ALB
2. **Set the `ALB_DNS` repository variable** with the ALB DNS from the infrastructure setup

## Triggers

| Trigger | Behavior |
|---------|----------|
| Push to `main` or `feature/MDAY-44-cloud-deployment` | Builds only services with changes |
| Release (published/created) | Builds all services |
| Manual dispatch | Builds all services (can specify custom API URL) |

### Path Filters

The workflow only runs when changes are detected in:
- `api_service/**`
- `domain/**`
- `frontend/**`
- `suv_ui/**`
- `.github/workflows/deploy-to-ecr.yml`

### Manual Dispatch Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `api_url` | No | API URL for frontend builds (e.g., `http://mayday-cluster-api-alb-xxx.eu-central-1.elb.amazonaws.com`). Falls back to `ALB_DNS` repository variable. |

## Services

| Service | Build Trigger | Context | Dockerfile |
|---------|---------------|---------|------------|
| `api_service` | Changes in `api_service/` or `domain/` | `.` (root) | `api_service/Dockerfile` |
| `frontend` | Changes in `frontend/` | `./frontend` | `./frontend/Dockerfile` |
| `suv_ui` | Changes in `suv_ui/` | `./suv_ui` | `./suv_ui/Dockerfile` |

## API URL Configuration

The frontend and SUV UI images need the API URL baked in at build time (Next.js `NEXT_PUBLIC_*` variables).

**API URL Resolution Priority:**
1. Manual input (`api_url` workflow input) - if provided
2. Repository variable (`ALB_DNS`) - automatically prefixed with `http://`
3. **Error** - if neither is set, the build fails

### Setting up ALB_DNS

1. Run the `Setup AWS Infrastructure` workflow
2. Copy the ALB DNS from the workflow summary
3. Go to: **Repository Settings → Secrets and variables → Actions → Variables**
4. Create new variable:
   - **Name:** `ALB_DNS`
   - **Value:** `mayday-cluster-api-alb-xxx.eu-central-1.elb.amazonaws.com` (without `http://`)

## Workflow Jobs

### 1. Detect Changes (`detect-changes`)

Analyzes the git diff to determine which services have been modified:

```
api_service or domain changes → build api_service
frontend changes             → build frontend
suv_ui changes               → build suv_ui
```

For manual dispatch or release events, all services are built regardless of changes.

### 2. Build Jobs (`build-api`, `build-frontend`, `build-suv-ui`)

Each build job performs the following steps:

1. **Checkout code** - Clone the repository
2. **Set up Docker Buildx** - Enable advanced Docker build features
3. **Configure AWS credentials** - Authenticate with AWS
4. **Login to Amazon ECR** - Get authorization token for ECR
5. **Create ECR repository** - Creates the repository if it doesn't exist (with image scanning enabled)
6. **Extract metadata** - Generate Docker tags based on semver and `latest`
7. **Set API URL** (frontend/suv_ui only) - Resolve the API URL from input or variable
8. **Build and push** - Build the Docker image and push to ECR with caching

### 3. Summary (`summary`)

Generates a build summary showing which services were built, skipped, or failed.

## Image Tagging

Images are tagged with:
- `latest` - Always applied
- Semantic version tags (for releases): `v1.2.3`, `v1.2`, `v1`

## ECR Repository Configuration

Each repository is created with:
- **Image scanning:** Enabled on push
- **Encryption:** AES256

## Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID_KAJ` | AWS access key for ECR authentication |
| `AWS_SECRET_ACCESS_KEY_KAJ` | AWS secret key for ECR authentication |

## Required Variables

| Variable | Description |
|----------|-------------|
| `ALB_DNS` | ALB DNS name for API (from infrastructure setup) |

## Configuration

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| `AWS_REGION` | `eu-central-1` | AWS region for ECR |
| `CLUSTER_NAME` | `mayday-cluster` | ECS cluster name |

## Build Caching

The workflow uses GitHub Actions cache (`type=gha`) for Docker layer caching, significantly speeding up subsequent builds.

## Example Scenarios

### Scenario 1: API code change
```
Push with changes to api_service/app/main.py
→ Only api_service image is built and pushed
→ frontend and suv_ui are skipped
```

### Scenario 2: Domain model change
```
Push with changes to domain/schemas.py
→ api_service image is built (domain is a dependency)
→ frontend and suv_ui are skipped
```

### Scenario 3: Manual workflow trigger
```
Manual dispatch from GitHub Actions UI
→ All three services are built and pushed
→ API URL resolved from ALB_DNS variable (or manual input)
```

### Scenario 4: Frontend change with custom API URL
```
Manual dispatch with api_url = "http://my-custom-api.example.com"
→ Frontend and SUV UI built with custom API URL
```

## Troubleshooting

### Build fails with "No API URL provided"
This means neither the `api_url` input nor the `ALB_DNS` repository variable is set.

**Solution:**
1. Run the `Setup AWS Infrastructure` workflow first
2. Copy the ALB DNS from the output
3. Add it as the `ALB_DNS` repository variable

### Build fails with "repository not found"
The workflow automatically creates ECR repositories. If this fails, ensure the AWS credentials have `ecr:CreateRepository` permission.

### Changes not triggering builds
Verify that changes are in the monitored paths. Changes to files outside `api_service/`, `domain/`, `frontend/`, or `suv_ui/` won't trigger the workflow.

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `setup-infrastructure.yml` | Creates VPC, ALB, ECS cluster (run first) |
| `deploy-to-ecs.yml` | Deploys services to ECS (run after ECR build) |
