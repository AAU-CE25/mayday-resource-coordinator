# ECS Pipeline - Deploy to AWS ECS Fargate

This document describes the GitHub Actions workflow that deploys the Mayday Resource Coordinator application to AWS ECS Fargate.

## Overview

**Workflow file:** `.github/workflows/deploy-to-ecs.yml`

The ECS pipeline deploys application services to ECS Fargate using pre-existing infrastructure. It requires that the infrastructure has already been created by the `setup-infrastructure.yml` workflow.

## Prerequisites

Before running this workflow:

1. **Run the Infrastructure Setup workflow** (`setup-infrastructure.yml`)
2. **Run the ECR Build workflow** (`deploy-to-ecr.yml`) to push images

## Triggers

| Trigger | Description |
|---------|-------------|
| Manual dispatch | Deploy with optional custom cluster name |

### Manual Dispatch Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `cluster_name` | `mayday-cluster` | ECS cluster name |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VPC (10.0.0.0/16)                             │
│  ┌─────────────────────┐       ┌─────────────────────┐                  │
│  │   Subnet 1          │       │   Subnet 2          │                  │
│  │   10.0.1.0/24       │       │   10.0.2.0/24       │                  │
│  │   (AZ 1)            │       │   (AZ 2)            │                  │
│  └─────────────────────┘       └─────────────────────┘                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 Application Load Balancer (ALB)                     │ │
│  │                      :80 → API Service                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         ECS Cluster                                 │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │ │
│  │  │    DB    │ │   API    │ │ Frontend │ │  SUV UI  │               │ │
│  │  │  :5432   │ │  :8000   │ │  :3000   │ │  :3030   │               │ │
│  │  │          │ │  (ALB)   │ │          │ │          │               │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Service Discovery: *.mayday-cluster.local (internal)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Services Deployed

| Service | Image | Port | Endpoint |
|---------|-------|------|----------|
| Database | `postgres:18` | 5432 | `db.mayday-cluster.local:5432` (internal) |
| API Service | `api_service:latest` | 8000 | ALB public DNS (port 80) |
| Frontend | `frontend:latest` | 3000 | Public IP:3000 |
| SUV UI | `suv_ui:latest` | 3030 | Public IP:3030 |

## Workflow Steps

The workflow performs the following steps:

### 1. Get Infrastructure IDs

Retrieves existing infrastructure created by `setup-infrastructure.yml`:
- VPC ID
- Subnet IDs
- Security Group ID
- Target Group ARN
- IAM Role ARN
- Service Discovery Namespace ID

### 2. Register Task Definitions

Creates/updates ECS task definitions for all services:
- Database (postgres:18)
- API Service
- Frontend
- SUV UI

### 3. Deploy Services

Creates or updates ECS services in order:
1. **Database** - Must be running first
2. **Wait 30 seconds** - Allow database to initialize
3. **API Service** - With ALB target group attachment
4. **Frontend** - Depends on API
5. **SUV UI** - Depends on API

### 4. Wait and Output

- Waits for services to stabilize
- Outputs public IPs and ALB DNS

## Task Definitions

### Resource Allocation

All services use:
- **CPU:** 512 units (0.5 vCPU)
- **Memory:** 1024 MB (1 GB)
- **Launch Type:** Fargate

### Environment Variables

#### Database
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mayday
PGDATA=/var/lib/postgresql/data/pgdata
```

#### API Service
```
POSTGRES_HOST=db.mayday-cluster.local
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mayday
POSTGRES_PORT=5432
CORS_ALLOW_ALL=true
```

#### SUV UI
```
PORT=3030
```

> **Note:** Frontend and SUV UI get `NEXT_PUBLIC_API_URL` baked in at build time via the ECR workflow.

## Accessing Services

### API (via ALB)
```
http://<alb-dns-name>
```
The ALB DNS is shown in the workflow summary.

### Frontend & SUV UI
Access via their public IPs (shown in workflow output):
```
Frontend: http://<frontend-ip>:3000
SUV UI:   http://<suv-ui-ip>:3030
```

## Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID_KAJ` | AWS access key |
| `AWS_SECRET_ACCESS_KEY_KAJ` | AWS secret key |

## Required Variables

| Variable | Description |
|----------|-------------|
| `AWS_ACCOUNT_ID_KAJ` | AWS account ID for ECR registry |

## Configuration

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| `AWS_REGION` | `eu-central-1` | AWS region |
| `CLUSTER_NAME` | `mayday-cluster` | ECS cluster name |

## Idempotency

The workflow is idempotent:
- **First run:** Creates all ECS services
- **Subsequent runs:** Updates existing services with `--force-new-deployment`

## Troubleshooting

### "VPC not found" error
The infrastructure doesn't exist. Run `Setup AWS Infrastructure` workflow first.

### Services fail to start
Check CloudWatch logs:
```bash
aws logs tail /ecs/mayday-cluster/<service_name> --follow
```

### Database connection issues
- Verify the database service is running and healthy
- Check that the API service is using the correct hostname (`db.mayday-cluster.local`)
- Ensure security group allows port 5432 from within the security group

### API not reachable via ALB
- Check ALB target group health in AWS Console
- Verify security group allows port 80 from 0.0.0.0/0
- Check API service health check endpoint (`/health`)

### Frontend shows API errors
- Verify the ALB_DNS was set correctly before building frontend images
- Check browser developer tools for the API URL being used
- Rebuild frontend/suv_ui images if ALB DNS changed

## Cleanup

To tear down the infrastructure, use the teardown script:
```bash
./infra/scripts/teardown_ecs.sh
```

This removes all ECS services, task definitions, and associated resources.

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `setup-infrastructure.yml` | Creates VPC, ALB, ECS cluster (run first) |
| `deploy-to-ecr.yml` | Builds and pushes Docker images |
