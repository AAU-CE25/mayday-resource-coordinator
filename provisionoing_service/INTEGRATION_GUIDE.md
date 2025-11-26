# ECR + Provisioning Service Integration Guide

This guide explains how your ECR images integrate with the on-demand provisioning service.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Release Pipeline                     │
│  Builds & Pushes: api_service, frontend, suv_ui → ECR          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS ECR (Image Registry)                      │
│  • api_service:latest, api_service:1.0.0                        │
│  • frontend:latest, frontend:1.0.0                              │
│  • suv_ui:latest, suv_ui:1.0.0                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   User Request → API Gateway                     │
│  POST /session with {user_id, version: "latest"}               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Lambda Controller                            │
│  1. Check user authorization (DynamoDB)                         │
│  2. Create ECS task definition with ECR images                  │
│  3. Start Fargate task (all 4 containers)                       │
│  4. Get public IP and generate unique URLs                      │
│  5. Store session info (DynamoDB)                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ECS Fargate Task (Per User)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ api_service  │  │   frontend   │  │    suv_ui    │          │
│  │ (ECR:latest) │  │ (ECR:latest) │  │ (ECR:latest) │          │
│  │   :8000      │  │   :3000      │  │   :3030      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐                                               │
│  │  PostgreSQL  │                                               │
│  │   (EFS)      │  ← User's persistent data                    │
│  └──────────────┘                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Return to User                                │
│  {                                                               │
│    session_id: "session-user123-abc",                           │
│    urls: {                                                       │
│      api: "http://54.123.45.67:8000",                          │
│      frontend: "http://54.123.45.67:3000",                     │
│      suv_ui: "http://54.123.45.67:3030"                        │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🔗 How ECR Connects to Provisioning

### 1. **Image Storage**
- Your GitHub Actions workflow pushes images to ECR on every release
- Images are tagged with versions: `latest`, `1.0.0`, `1.2`, etc.
- Lambda pulls these images when creating ECS tasks

### 2. **Lambda Controller**
The Lambda function:
- Reads `ECR_REGISTRY` environment variable (your ECR URL)
- Builds ECS task definitions referencing ECR images:
  ```python
  image: f'{ECR_REGISTRY}/api_service:{version}'
  ```
- Allows users to specify version or defaults to `latest`

### 3. **ECS Fargate Execution**
- ECS Fargate automatically pulls images from ECR
- Uses IAM roles for secure access (no credentials needed)
- Each user session gets a fresh container instance

## 📋 Setup Steps

### 1. **ECR Setup (Already Done)**
```bash
# Your images are pushed to ECR on release
# Example ECR URLs:
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/api_service:latest
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/suv_ui:latest
```

### 2. **Update Terraform Configuration**

Add ECR configuration to `terraform/main.tf`:

```terraform
# Get your ECR repository URLs
data "aws_ecr_repository" "api_service" {
  name = "api_service"
}

data "aws_ecr_repository" "frontend" {
  name = "frontend"
}

data "aws_ecr_repository" "suv_ui" {
  name = "suv_ui"
}

# Pass ECR registry to Lambda
resource "aws_lambda_function" "provisioning_controller" {
  # ... existing config ...
  
  environment {
    variables = {
      ECR_REGISTRY          = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
      ECS_CLUSTER_NAME      = aws_ecs_cluster.main.name
      SUBNET_IDS            = join(",", aws_subnet.private[*].id)
      SECURITY_GROUP_ID     = aws_security_group.ecs_tasks.id
      DYNAMODB_USERS_TABLE  = aws_dynamodb_table.users.name
      DYNAMODB_SESSIONS_TABLE = aws_dynamodb_table.sessions.name
      ECS_EXECUTION_ROLE_ARN = aws_iam_role.ecs_execution.arn
      ECS_TASK_ROLE_ARN     = aws_iam_role.ecs_task.arn
      EFS_FILE_SYSTEM_ID    = aws_efs_file_system.user_data.id
    }
  }
}
```

### 3. **IAM Permissions**

Ensure ECS execution role can pull from ECR:

```terraform
resource "aws_iam_role_policy" "ecs_ecr_access" {
  name = "ecs-ecr-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}
```

### 4. **Lambda Permissions**

Lambda needs ECS access:

```terraform
resource "aws_iam_role_policy" "lambda_ecs_access" {
  name = "lambda-ecs-access"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RegisterTaskDefinition",
          "ecs:RunTask",
          "ecs:StopTask",
          "ecs:DescribeTasks",
          "iam:PassRole"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## 🚀 Usage Flow

### Starting a Session

**Request:**
```bash
curl -X POST https://your-api-gateway.amazonaws.com/session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "action": "start",
    "version": "latest"
  }'
```

**Response:**
```json
{
  "session_id": "session-user123-a1b2c3d4",
  "task_arn": "arn:aws:ecs:us-east-1:123456:task/...",
  "status": "starting",
  "urls": {
    "api": "http://54.123.45.67:8000",
    "frontend": "http://54.123.45.67:3000",
    "suv_ui": "http://54.123.45.67:3030"
  },
  "version": "latest"
}
```

### Stopping a Session

**Request:**
```bash
curl -X POST https://your-api-gateway.amazonaws.com/session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "action": "stop",
    "session_id": "session-user123-a1b2c3d4"
  }'
```

**Response:**
```json
{
  "session_id": "session-user123-a1b2c3d4",
  "status": "stopped",
  "message": "Session has been terminated"
}
```

## 🎯 Key Features

### 1. **Version Control**
- Users can request specific versions: `"version": "1.0.0"`
- Defaults to `latest` for newest release
- Easy rollback by specifying older versions

### 2. **Persistent Storage**
- Each user has an EFS volume
- Database data persists across sessions
- Mounts to PostgreSQL container automatically

### 3. **Isolated Sessions**
- Each user gets their own ECS task
- Complete isolation between sessions
- Unique URLs per session

### 4. **Auto-Cleanup**
- Sessions can be stopped via API
- Optionally: Add EventBridge rule for auto-stop after X hours
- Resources freed immediately

## 🔧 DynamoDB Tables

### Users Table
```json
{
  "user_id": "user123",
  "authorized": true,
  "email": "user@example.com",
  "efs_volume_id": "fs-abc123"
}
```

### Sessions Table
```json
{
  "session_id": "session-user123-a1b2c3d4",
  "user_id": "user123",
  "task_arn": "arn:aws:ecs:...",
  "public_ip": "54.123.45.67",
  "version": "latest",
  "status": "running",
  "created_at": "2025-11-26T10:30:00Z",
  "api_url": "http://54.123.45.67:8000",
  "frontend_url": "http://54.123.45.67:3000",
  "suv_ui_url": "http://54.123.45.67:3030"
}
```

## 🔒 Security Best Practices

1. **Private Subnets**: Run ECS tasks in private subnets with NAT gateway
2. **Security Groups**: Restrict access to only necessary ports
3. **IAM Roles**: Use least-privilege IAM policies
4. **ECR Encryption**: Enable encryption at rest (already configured)
5. **Image Scanning**: Enable vulnerability scanning (already configured)
6. **API Authentication**: Add API Gateway authorizer

## 📊 Monitoring

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/provisioning-controller --follow

# View ECS task logs
aws logs tail /ecs/mayday-sessions --follow
```

### Session Metrics
- Number of active sessions
- Session duration
- Resource utilization per session
- Image pull times

## 💰 Cost Optimization

1. **Stop Idle Sessions**: Implement auto-stop after inactivity
2. **Right-Size Tasks**: Adjust CPU/memory based on usage
3. **Spot Instances**: Consider Fargate Spot for cost savings
4. **Image Compression**: Optimize Docker images for faster pulls

## 🚀 Deployment

```bash
# 1. Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# 2. Deploy Lambda
cd ../lambda
zip -r function.zip controller.py
aws lambda update-function-code \
  --function-name provisioning-controller \
  --zip-file fileb://function.zip

# 3. Test the endpoint
curl -X POST https://your-api.amazonaws.com/session \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "action": "start"}'
```

## 🎯 Next Steps

1. **Custom Domains**: Set up Route53 for friendly URLs
2. **Load Balancer**: Use ALB for HTTPS and better routing
3. **Auto-Scaling**: Scale based on active sessions
4. **Monitoring Dashboard**: Create CloudWatch dashboard
5. **CI/CD**: Automate infrastructure updates
6. **Cost Alerts**: Set up billing alerts

## 📝 Example: Deploying New Version

```bash
# 1. Create GitHub release (triggers ECR push)
gh release create v1.2.0 --title "Release 1.2.0" --notes "New features"

# 2. Wait for images to build (check Actions tab)

# 3. Users can request the new version
curl -X POST https://your-api.amazonaws.com/session \
  -d '{"user_id": "user123", "action": "start", "version": "1.2.0"}'

# 4. Or update to use latest by default (no code changes needed)
```

## ❓ FAQ

**Q: How long does it take to start a session?**
A: ~30-60 seconds for Fargate to pull images and start containers

**Q: Can multiple users share the same task?**
A: No, each session is isolated for security and data integrity

**Q: What happens if a user forgets to stop their session?**
A: Implement auto-stop with EventBridge (see terraform examples)

**Q: Can I update the running containers?**
A: No, stop the session and start a new one with the updated version

**Q: How much does each session cost?**
A: Approx $0.04/hour for the configured 1 vCPU, 2GB RAM Fargate task
