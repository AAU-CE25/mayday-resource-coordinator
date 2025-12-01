# ECS Pipeline - Deploy to AWS ECS Fargate

This document describes the GitHub Actions workflow that deploys the Mayday Resource Coordinator application to AWS ECS Fargate.

## Overview

**Workflow file:** `.github/workflows/deploy-to-ecs.yml`

The ECS pipeline creates or updates all required AWS infrastructure and deploys the application services to ECS Fargate. It's designed to be idempotent - running it multiple times will either create new resources or update existing ones.

## Triggers

| Trigger | Description |
|---------|-------------|
| Push to `main` | Automatic deployment on merge |
| Manual dispatch | Deploy with custom cluster name |

### Manual Dispatch Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `cluster_name` | `mayday-cluster` | ECS cluster name |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           VPC (10.0.0.0/16)                     │
│  ┌─────────────────────┐       ┌─────────────────────┐          │
│  │   Subnet 1          │       │   Subnet 2          │          │
│  │   10.0.1.0/24       │       │   10.0.2.0/24       │          │
│  │   (AZ 1)            │       │   (AZ 2)            │          │
│  └─────────────────────┘       └─────────────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ECS Cluster                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │
│  │  │    DB    │ │   API    │ │ Frontend │ │  SUV UI  │       │ │
│  │  │  :5432   │ │  :8000   │ │  :3000   │ │  :3030   │       │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Service Discovery: *.mayday-cluster.local                      │
└─────────────────────────────────────────────────────────────────┘
```

## Services Deployed

| Service | Image | Port | Internal Endpoint |
|---------|-------|------|-------------------|
| Database | `postgres:18` | 5432 | `db.mayday-cluster.local:5432` |
| API Service | `api_service:latest` | 8000 | `api.mayday-cluster.local:8000` |
| Frontend | `frontend:latest` | 3000 | `frontend.mayday-cluster.local:3000` |
| SUV UI | `suv_ui:latest` | 3030 | `suv-ui.mayday-cluster.local:3030` |

## Infrastructure Created

### Networking

| Resource | Description |
|----------|-------------|
| VPC | Virtual Private Cloud with CIDR `10.0.0.0/16` |
| Subnets | Two public subnets in different AZs (`10.0.1.0/24`, `10.0.2.0/24`) |
| Internet Gateway | Enables internet access for the VPC |
| Route Table | Routes traffic to the Internet Gateway |

### Security

| Resource | Description |
|----------|-------------|
| Security Group | Controls inbound/outbound traffic |

**Inbound Rules:**
| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 8000 | TCP | 0.0.0.0/0 | API Service |
| 3000 | TCP | 0.0.0.0/0 | Frontend |
| 3030 | TCP | 0.0.0.0/0 | SUV UI |
| 5432 | TCP | Self (SG) | PostgreSQL (internal only) |

### ECS Resources

| Resource | Description |
|----------|-------------|
| ECS Cluster | Fargate cluster for running containers |
| Task Definitions | Container configurations for each service |
| ECS Services | Manage desired container count and deployment |
| IAM Role | Task execution role with ECR and CloudWatch permissions |

### Service Discovery

| Resource | Description |
|----------|-------------|
| Private DNS Namespace | `mayday-cluster.local` |
| Service Discovery Services | DNS records for each service |

### Logging

| Log Group | Service |
|-----------|---------|
| `/ecs/mayday-cluster/db` | Database |
| `/ecs/mayday-cluster/api_service` | API Service |
| `/ecs/mayday-cluster/frontend` | Frontend |
| `/ecs/mayday-cluster/suv_ui` | SUV UI |

## Task Definitions

### Resource Allocation

All services use the same resource allocation:
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

#### Frontend & SUV UI
```
NEXT_PUBLIC_API_URL=http://api.mayday-cluster.local:8000
PORT=3030  # SUV UI only
```

## Deployment Order

Services are deployed in the following order to respect dependencies:

1. **Database** - Must be running first
2. **Wait 30 seconds** - Allow database to initialize
3. **API Service** - Depends on database
4. **Frontend** - Depends on API
5. **SUV UI** - Depends on API

## Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID_KAJ` | AWS access key |
| `AWS_SECRET_ACCESS_KEY_KAJ` | AWS secret key |
| `AWS_ACCOUNT_ID` | AWS account ID for ECR registry |

## Required IAM Permissions

The AWS credentials need permissions for:

- **EC2:** VPC, Subnets, Security Groups, Internet Gateway, Route Tables
- **ECS:** Clusters, Task Definitions, Services
- **ECR:** Repository access (read)
- **IAM:** Create/manage roles and policies
- **CloudWatch Logs:** Create log groups
- **Service Discovery:** Namespaces and services

See [IAM-POLICY.md](./IAM-POLICY.md) for the complete IAM policy.

## Configuration

| Environment Variable | Value | Description |
|---------------------|-------|-------------|
| `AWS_REGION` | `eu-central-1` | AWS region |
| `CLUSTER_NAME` | `mayday-cluster` | ECS cluster name |
| `VPC_CIDR` | `10.0.0.0/16` | VPC CIDR block |

## Workflow Steps

1. **Configure AWS credentials**
2. **Create/get VPC** - With DNS hostnames enabled
3. **Create/get Internet Gateway** - Attached to VPC
4. **Create/get Subnets** - Two subnets in different AZs
5. **Create/get Route Table** - With route to Internet Gateway
6. **Create/get Security Group** - With required ingress rules
7. **Create/get ECS Cluster**
8. **Create/get IAM Execution Role** - For ECS tasks
9. **Create CloudWatch Log Groups**
10. **Register Task Definitions** - For all services
11. **Create/get Service Discovery Namespace**
12. **Deploy Services** - Create or update ECS services
13. **Wait for Stabilization** - Ensure services are healthy
14. **Output Public IPs** - Display service endpoints

## Accessing Services

After deployment, services receive public IPs. The workflow outputs these IPs in the "Get Service Public IPs" step.

**Access URLs:**
- API: `http://<api-public-ip>:8000`
- Frontend: `http://<frontend-public-ip>:3000`
- SUV UI: `http://<suv-ui-public-ip>:3030`

## Idempotency

The workflow is idempotent:
- **First run:** Creates all resources
- **Subsequent runs:** Updates existing resources with `--force-new-deployment`

## Troubleshooting

### Services fail to start
Check CloudWatch logs for the specific service:
```bash
aws logs tail /ecs/mayday-cluster/<service_name> --follow
```

### Database connection issues
- Verify the database service is running and healthy
- Check that the API service is using the correct hostname (`db.mayday-cluster.local`)
- Ensure security group allows port 5432 from within the security group

### Service discovery not working
- Wait a few minutes for DNS propagation
- Verify the namespace exists: `aws servicediscovery list-namespaces`
- Check service registrations: `aws servicediscovery list-services`

### Public IPs not assigned
Ensure subnets have `MapPublicIpOnLaunch` enabled and the route table has a route to the Internet Gateway.

## Cleanup

To tear down the infrastructure, use the teardown script:
```bash
./infra/scripts/teardown_ecs.sh
```

This removes all ECS services, task definitions, and associated resources.
