# Testing GitHub Actions Workflows

## ✅ Pre-flight Checks Completed

- [x] S3 backend created successfully
- [x] Terraform initialized
- [x] Terraform configuration validated

---

## Step-by-Step Testing Guide

### **Step 1: Push Changes to GitHub**

```bash
cd "/Users/kajetanp/Documents/AAU CE/code/mday/mayday-resource-coordinator"
git add .
git commit -m "Add ECR module and GitHub Actions workflows"
git push origin feature/MDAY-44-cloud-deployment
```

---

### **Step 2: Test Terraform Workflow (Plan Only)**

**Option A: Via Pull Request (Recommended)**

1. Create a PR from `feature/MDAY-44-cloud-deployment` to `main`
2. GitHub Actions will automatically:
   - Run `terraform fmt -check`
   - Run `terraform init`
   - Run `terraform validate`
   - Run `terraform plan`
   - Post plan results as a comment on the PR
   - Run security scans (tfsec, Checkov)

3. Review the plan output in the PR comment

**Option B: Manual Trigger**

1. Go to GitHub → Actions → "Terraform Infrastructure"
2. Click "Run workflow"
3. Select branch: `feature/MDAY-44-cloud-deployment`
4. Select action: `plan`
5. Click "Run workflow"
6. Wait for completion (~2-3 minutes)
7. Review logs

**Expected Result:**
```
✅ Format check passes (or shows formatting issues)
✅ Initialization successful
✅ Validation successful
✅ Plan shows resources to be created:
   - 4 ECR repositories
   - VPC, subnets, NAT gateway
   - ALB with 3 target groups
   - ECS cluster
   - 4 ECS services (db, api, frontend, suv-ui)
   - Security groups
   - Service discovery
   - Autoscaling policies
```

---

### **Step 3: Test Build and Push to ECR Workflow**

**⚠️ Important:** This requires Terraform to be applied first to create ECR repositories!

**Before testing, you need to:**

1. Apply Terraform (creates ECR repos):
   ```bash
   # Option A: Via GitHub Actions
   Actions → Terraform Infrastructure → Run workflow
   - action: apply
   - branch: main (after merging PR)
   
   # Option B: Locally
   cd infra/terraform
   terraform apply -var="aws_account_id=390299133544" -var="postgres_password=YOUR_PASSWORD"
   ```

2. Once ECR repos exist, test the build workflow:

**Manual Trigger:**

1. Go to GitHub → Actions → "Build and Push to ECR"
2. Click "Run workflow"
3. Select branch: `feature/MDAY-44-cloud-deployment`
4. Input services: `api` (test one service first)
5. Click "Run workflow"
6. Monitor progress (~5-10 minutes for first build)

**Expected Result:**
```
✅ Checkout code
✅ Configure AWS credentials
✅ Login to ECR
✅ Build Docker image for API
✅ Push image to mayday-api repository
✅ Image tagged with: latest, branch name, commit SHA
```

**Verify:**
```bash
# Check ECR repositories
aws ecr describe-repositories --region eu-central-1

# Check images in repository
aws ecr list-images --repository-name mayday-api --region eu-central-1
```

---

### **Step 4: Test Deploy to ECS Workflow**

**⚠️ Prerequisites:**
- ECR repositories exist
- Docker images pushed to ECR
- ECS services created by Terraform

**Manual Trigger:**

1. Go to GitHub → Actions → "Deploy to ECS"
2. Click "Run workflow"
3. Select:
   - environment: `production`
   - services: `api` (test one first)
4. Click "Run workflow"
5. Wait for deployment (~3-5 minutes)

**Expected Result:**
```
✅ Configure AWS credentials
✅ Force new deployment of API service
✅ Wait for service to stabilize
✅ Show deployment summary
✅ Display ALB URL
```

**Verify:**
```bash
# Check service status
aws ecs describe-services \
  --cluster mayday-cluster \
  --services mayday-cluster-api-service \
  --region eu-central-1 \
  --query 'services[0].[serviceName,status,runningCount,desiredCount,deployments]'

# Check task status
aws ecs list-tasks \
  --cluster mayday-cluster \
  --service-name mayday-cluster-api-service \
  --region eu-central-1

# Test API endpoint
curl http://$(terraform output -raw alb_dns_name)/health
```

---

## Complete End-to-End Test

### **Full Deployment Flow:**

```bash
# 1. Setup (one-time)
cd infra/scripts
./setup-terraform-backend.sh

# 2. Apply infrastructure via GitHub Actions
# Actions → Terraform Infrastructure → apply

# 3. Build all images via GitHub Actions
# Actions → Build and Push to ECR → services: all

# 4. Deploy all services via GitHub Actions
# Actions → Deploy to ECS → services: all

# 5. Verify deployment
terraform output alb_dns_name
curl http://<alb-dns>/health
curl http://<alb-dns>/dashboard
curl http://<alb-dns>/volunteer
```

---

## Troubleshooting

### **Issue: Terraform backend error**
```
Error: Failed to configure backend
```
**Solution:**
```bash
cd infra/scripts
./setup-terraform-backend.sh
```

### **Issue: ECR repository not found**
```
Error: Repository mayday-api does not exist
```
**Solution:** Run Terraform apply first to create ECR repositories

### **Issue: ECS service not found**
```
Error: Service mayday-cluster-api-service does not exist
```
**Solution:** Run Terraform apply to create ECS services

### **Issue: Image pull error in ECS**
```
Error: CannotPullContainerError
```
**Solution:**
1. Verify image exists: `aws ecr list-images --repository-name mayday-api`
2. Check task execution role has ECR permissions
3. Verify image tag matches task definition

### **Issue: GitHub Actions workflow fails with AWS credentials**
```
Error: Could not load credentials from any providers
```
**Solution:** Add GitHub secrets:
- `AWS_ACCESS_KEY_ID_KAJ`
- `AWS_SECRET_ACCESS_KEY_KAJ`
- `AWS_ACCOUNT_ID_KAJ` (as variable)
- `POSTGRES_PASSWORD`

---

## Monitoring

### **GitHub Actions Logs**
- Go to Actions tab
- Click on workflow run
- Expand each step to see detailed logs

### **AWS Resources**
```bash
# ECR
aws ecr describe-repositories --region eu-central-1

# ECS Cluster
aws ecs describe-clusters --clusters mayday-cluster --region eu-central-1

# ECS Services
aws ecs list-services --cluster mayday-cluster --region eu-central-1

# CloudWatch Logs
aws logs tail /ecs/mayday-cluster/api_service --follow --region eu-central-1
```

### **Terraform State**
```bash
cd infra/terraform
terraform show
terraform state list
```

---

## Success Criteria

✅ **Terraform Workflow:**
- Plan runs without errors
- Shows expected resource changes
- Security scans complete

✅ **Build Workflow:**
- All Docker images build successfully
- Images pushed to ECR
- Multiple tags created

✅ **Deploy Workflow:**
- Services update without errors
- Health checks pass
- Services stabilize within 5 minutes

✅ **Application:**
- API responds at `/health`
- Frontend accessible at `/dashboard`
- SUV UI accessible at `/volunteer`
- All services show 2/2 running tasks

---

## Next Steps After Testing

1. Merge PR to main
2. Set up automatic deployments (optional)
3. Configure monitoring/alerting
4. Set up production secrets properly
5. Document deployment procedures for team

