# AWS Deployment Documentation

This folder contains documentation for deploying the Mayday Resource Coordinator to AWS ECS Fargate.

## Quick Start

### 1. Setup Infrastructure (One-time)

Run the **Setup AWS Infrastructure** workflow:
1. Go to GitHub Actions
2. Select "Setup AWS Infrastructure"
3. Click "Run workflow"
4. Wait for completion and copy the **ALB DNS** from the summary

### 2. Configure ALB DNS Variable

1. Go to **Repository Settings → Secrets and variables → Actions → Variables**
2. Create new variable:
   - **Name:** `ALB_DNS`
   - **Value:** `<alb-dns-from-step-1>` (without `http://`)

### 3. Build Docker Images

Run the **Build and Push to ECR** workflow:
1. Go to GitHub Actions
2. Select "Build and Push to ECR"
3. Click "Run workflow"

Or push changes to trigger automatic builds.

### 4. Deploy to ECS

Run the **Deploy to AWS ECS** workflow:
1. Go to GitHub Actions
2. Select "Deploy to AWS ECS"
3. Click "Run workflow"

## Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Setup Infrastructure | `setup-infrastructure.yml` | Manual | Creates VPC, ALB, ECS cluster |
| Build to ECR | `deploy-to-ecr.yml` | Push/Manual | Builds Docker images |
| Deploy to ECS | `deploy-to-ecs.yml` | Manual | Deploys services |

## Documentation

| Document | Description |
|----------|-------------|
| [INFRASTRUCTURE-SETUP.md](./INFRASTRUCTURE-SETUP.md) | Infrastructure provisioning workflow |
| [ECR-PIPELINE.md](./ECR-PIPELINE.md) | Docker image build pipeline |
| [ECS-PIPELINE.md](./ECS-PIPELINE.md) | ECS service deployment |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Application Load Balancer                        │ │
│  │                         (Public DNS)                                │ │
│  │                            :80                                      │ │
│  └────────────────────────────┬───────────────────────────────────────┘ │
│                               │                                          │
│  ┌────────────────────────────▼───────────────────────────────────────┐ │
│  │                        ECS Cluster                                  │ │
│  │                                                                     │ │
│  │   ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐       │ │
│  │   │   DB    │◄───│   API   │◄───│ Frontend │    │ SUV UI  │       │ │
│  │   │ :5432   │    │  :8000  │    │  :3000   │    │  :3030  │       │ │
│  │   └─────────┘    └─────────┘    └──────────┘    └─────────┘       │ │
│  │                       ▲                              ▲              │ │
│  │                       │                              │              │ │
│  │                    ALB TG                      Public IPs          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Service Discovery: db.mayday-cluster.local, api.mayday-cluster.local   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Access Points

After deployment:

| Service | Access Method |
|---------|---------------|
| **API** | `http://<ALB-DNS>` (port 80) |
| **Frontend** | `http://<frontend-public-ip>:3000` |
| **SUV UI** | `http://<suv-ui-public-ip>:3030` |

Public IPs are shown in the ECS deployment workflow summary.

## Required GitHub Configuration

### Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID_KAJ` | AWS access key |
| `AWS_SECRET_ACCESS_KEY_KAJ` | AWS secret key |

### Variables

| Variable | Description |
|----------|-------------|
| `AWS_ACCOUNT_ID_KAJ` | AWS account ID |
| `ALB_DNS` | ALB DNS name (set after infrastructure setup) |

## Teardown

To remove all AWS resources:

```bash
./infra/scripts/teardown_ecs.sh
```

## Troubleshooting

### Common Issues

1. **"No API URL provided" during ECR build**
   - Set the `ALB_DNS` repository variable

2. **"VPC not found" during ECS deploy**
   - Run the infrastructure setup workflow first

3. **Frontend can't reach API**
   - Ensure images were built with correct ALB_DNS
   - Rebuild frontend/suv_ui if ALB changed

4. **Services fail to start**
   - Check CloudWatch logs: `/ecs/mayday-cluster/<service>`
