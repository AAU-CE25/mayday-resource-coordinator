# ECR Pipeline - Build and Push Docker Images

This document describes the GitHub Actions workflow that builds and pushes Docker images to AWS Elastic Container Registry (ECR).

## Overview

**Workflow file:** `.github/workflows/deploy-to-ecr.yml`

The ECR pipeline automatically builds Docker images for modified services and pushes them to AWS ECR. It uses intelligent change detection to only build images for services that have been modified, saving build time and resources.

## Triggers

| Trigger | Behavior |
|---------|----------|
| Push to `main` | Builds only services with changes |
| Release (published/created) | Builds all services |
| Manual dispatch | Builds all services |

### Path Filters

The workflow only runs when changes are detected in:
- `api_service/**`
- `domain/**`
- `frontend/**`
- `suv_ui/**`
- `.github/workflows/deploy-to-ecr.yml`

## Services

| Service | Build Trigger | Context | Dockerfile |
|---------|---------------|---------|------------|
| `api_service` | Changes in `api_service/` or `domain/` | `.` (root) | `api_service/Dockerfile` |
| `frontend` | Changes in `frontend/` | `./frontend` | `./frontend/Dockerfile` |
| `suv_ui` | Changes in `suv_ui/` | `./suv_ui` | `./suv_ui/Dockerfile` |

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
7. **Build and push** - Build the Docker image and push to ECR with caching
8. **Clean up old images** - Remove all images except `latest` to save storage costs

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

## Configuration

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| `AWS_REGION` | `eu-central-1` | AWS region for ECR |

## Image Cleanup

After each successful build, old images (all except `latest`) are automatically deleted from ECR. This helps manage storage costs and keeps the repository clean.

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
```

## Troubleshooting

### Build fails with "repository not found"
The workflow automatically creates ECR repositories. If this fails, ensure the AWS credentials have `ecr:CreateRepository` permission.

### Old images not being deleted
Ensure the AWS credentials have the following permissions:
- `ecr:DescribeImages`
- `ecr:BatchDeleteImage`
- `ecr:ListImages`

### Changes not triggering builds
Verify that changes are in the monitored paths. Changes to files outside `api_service/`, `domain/`, `frontend/`, or `suv_ui/` won't trigger the workflow.
