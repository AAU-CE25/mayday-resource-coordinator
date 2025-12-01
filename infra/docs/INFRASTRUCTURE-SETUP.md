# Infrastructure Setup - AWS Infrastructure Provisioning

This document describes the GitHub Actions workflow that creates the foundational AWS infrastructure for the Mayday Resource Coordinator application.

## Overview

**Workflow file:** `.github/workflows/setup-infrastructure.yml`

The infrastructure setup workflow creates all required AWS resources including VPC, subnets, security groups, ALB, ECS cluster, and service discovery. This is a **one-time setup** that should be run before deploying the application.

## Triggers

| Trigger | Description |
|---------|-------------|
| Manual dispatch only | Run from GitHub Actions UI |

### Manual Dispatch Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `cluster_name` | `mayday-cluster` | Name for the ECS cluster and related resources |

## Infrastructure Created

### Networking

| Resource | Name Pattern | Description |
|----------|--------------|-------------|
| VPC | `{cluster_name}-vpc` | Virtual Private Cloud with CIDR `10.0.0.0/16` |
| Subnet 1 | `{cluster_name}-subnet-1` | Public subnet `10.0.1.0/24` in AZ 1 |
| Subnet 2 | `{cluster_name}-subnet-2` | Public subnet `10.0.2.0/24` in AZ 2 |
| Internet Gateway | `{cluster_name}-igw` | Enables internet access |
| Route Table | `{cluster_name}-rt` | Routes traffic to Internet Gateway |

### Security

| Resource | Name Pattern | Description |
|----------|--------------|-------------|
| Security Group | `{cluster_name}-sg` | Controls inbound/outbound traffic |

**Inbound Rules:**

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 80 | TCP | 0.0.0.0/0 | ALB HTTP traffic |
| 8000 | TCP | 0.0.0.0/0 | API Service (direct) |
| 3000 | TCP | 0.0.0.0/0 | Frontend |
| 3030 | TCP | 0.0.0.0/0 | SUV UI |
| 5432 | TCP | Self (SG) | PostgreSQL (internal only) |

### Application Load Balancer

| Resource | Name Pattern | Description |
|----------|--------------|-------------|
| ALB | `{cluster_name}-api-alb` | Internet-facing load balancer for API |
| Target Group | `{cluster_name}-api-tg` | Routes to API containers on port 8000 |
| Listener | Port 80 | Forwards HTTP traffic to target group |

**Target Group Health Check:**
- Path: `/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

### ECS Resources

| Resource | Name Pattern | Description |
|----------|--------------|-------------|
| ECS Cluster | `{cluster_name}` | Fargate cluster for running containers |
| IAM Role | `{cluster_name}-task-execution-role` | Task execution role with ECR and CloudWatch permissions |

### CloudWatch Logging

| Log Group | Service |
|-----------|---------|
| `/ecs/{cluster_name}/db` | Database |
| `/ecs/{cluster_name}/api_service` | API Service |
| `/ecs/{cluster_name}/frontend` | Frontend |
| `/ecs/{cluster_name}/suv_ui` | SUV UI |

### Service Discovery

| Resource | Name Pattern | Description |
|----------|--------------|-------------|
| Private DNS Namespace | `{cluster_name}.local` | Internal DNS for service-to-service communication |

## Workflow Steps

1. **Configure AWS credentials** - Authenticate with AWS
2. **Create/get VPC** - With DNS hostnames enabled
3. **Create/get Internet Gateway** - Attached to VPC
4. **Create/get Subnets** - Two subnets in different AZs
5. **Create/get Route Table** - With route to Internet Gateway
6. **Create/get Security Group** - With required ingress rules
7. **Create/get ALB** - Internet-facing application load balancer
8. **Create/get Target Group** - For API service routing
9. **Create/get ALB Listener** - HTTP listener on port 80
10. **Create/get ECS Cluster** - Fargate cluster
11. **Create/get IAM Execution Role** - For ECS tasks
12. **Create CloudWatch Log Groups** - For all services
13. **Create/get Service Discovery Namespace** - Private DNS

## Output

After successful execution, the workflow summary displays:

- All resource IDs (VPC, subnets, security group, etc.)
- **ALB DNS** - The public DNS name for the API load balancer
- **API URL** - The full URL to access the API

### Next Steps After Running

1. **Copy the ALB DNS** from the workflow summary
2. **Create a GitHub repository variable:**
   - Go to: **Settings → Secrets and variables → Actions → Variables**
   - Click **New repository variable**
   - Name: `ALB_DNS`
   - Value: The ALB DNS (e.g., `mayday-cluster-api-alb-123456789.eu-central-1.elb.amazonaws.com`)

3. **Run the ECR Build workflow** to build images with the correct API URL
4. **Run the ECS Deploy workflow** to deploy services

## Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID_KAJ` | AWS access key |
| `AWS_SECRET_ACCESS_KEY_KAJ` | AWS secret key |

## Required IAM Permissions

The AWS credentials need permissions for:

- **EC2:** VPC, Subnets, Security Groups, Internet Gateway, Route Tables
- **ELBv2:** Load Balancers, Target Groups, Listeners
- **ECS:** Clusters
- **IAM:** Create/manage roles and policies
- **CloudWatch Logs:** Create log groups
- **Service Discovery:** Namespaces and services

## Configuration

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| `AWS_REGION` | `eu-central-1` | AWS region |
| `CLUSTER_NAME` | `mayday-cluster` | Base name for resources |
| `VPC_CIDR` | `10.0.0.0/16` | VPC CIDR block |

## Idempotency

The workflow is fully idempotent:
- **First run:** Creates all resources
- **Subsequent runs:** Reuses existing resources (no duplicates created)

This allows you to safely re-run the workflow to verify or recover infrastructure.

## Architecture Diagram

```
Internet
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│                        VPC (10.0.0.0/16)                      │
│                                                               │
│  ┌─────────────────────┐    ┌─────────────────────┐          │
│  │  Subnet 1 (AZ-a)    │    │  Subnet 2 (AZ-b)    │          │
│  │  10.0.1.0/24        │    │  10.0.2.0/24        │          │
│  └─────────────────────┘    └─────────────────────┘          │
│            │                          │                       │
│            └──────────┬───────────────┘                       │
│                       │                                       │
│              ┌────────▼────────┐                              │
│              │      ALB        │                              │
│              │   (Port 80)     │                              │
│              └────────┬────────┘                              │
│                       │                                       │
│              ┌────────▼────────┐                              │
│              │  Target Group   │                              │
│              │   (Port 8000)   │                              │
│              └─────────────────┘                              │
│                                                               │
│  Service Discovery: *.mayday-cluster.local                   │
│                                                               │
│  Security Group: Allows 80, 3000, 3030, 8000 from internet   │
│                  Allows 5432 internally                       │
└───────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### VPC creation fails
- Check AWS account limits for VPCs in the region
- Ensure the CIDR block doesn't conflict with existing VPCs

### ALB creation fails
- Ensure both subnets are in different availability zones
- Verify the security group exists and allows port 80

### Service discovery namespace creation times out
- The workflow waits up to 150 seconds for namespace creation
- Check AWS Service Discovery in the console for status

### IAM role creation fails
- Ensure the credentials have `iam:CreateRole` and `iam:AttachRolePolicy` permissions

## Cleanup

To tear down all infrastructure:
```bash
./infra/scripts/teardown_ecs.sh
```

**Note:** This will delete all services, the ECS cluster, ALB, and associated resources. The VPC and networking may need manual cleanup.

## Related Workflows

| Workflow | Purpose | Run Order |
|----------|---------|-----------|
| `setup-infrastructure.yml` | Creates infrastructure | 1st |
| `deploy-to-ecr.yml` | Builds Docker images | 2nd |
| `deploy-to-ecs.yml` | Deploys services | 3rd |
