# Infrastructure Changes Summary - MDAY-44

## Date: December 4, 2025

This document summarizes the critical infrastructure improvements made to prepare for production deployment.

---

## ✅ Changes Completed

### 1. **Fixed Security Group Rules** 
**File**: `infra/terraform/modules/common/main.tf`

**Changes**:
- Restricted ports 3000, 3030, 8000, and 5432 to **internal traffic only** (`self = true`)
- Only port 80 (ALB HTTP) remains publicly accessible
- This follows security best practices and minimizes attack surface

**Impact**: Significantly improved security posture by preventing direct access to application services.

---

### 2. **Added Missing IAM Permissions**
**File**: `infra/iam-policies/setup-infrastructure-policy.json`

**New Permissions Added**:
- **IAM**: `DeleteRole`, `ListAttachedRolePolicies`, `ListRolePolicies`, `TagRole`, `UntagRole`, `ListRoleTags`
- **ELB**: `DescribeLoadBalancerAttributes`, `DescribeTargetGroupAttributes`, `CreateRule`, `DeleteRule`, `DescribeRules`, `ModifyRule`, `RemoveTags`, `DescribeTags`
- **ECS**: `PutClusterCapacityProviders`, `TagResource`, `UntagResource`, `ListTagsForResource`
- **CloudWatch Logs**: `DeleteRetentionPolicy`, `TagLogGroup`, `UntagLogGroup`, `ListTagsLogGroup`
- **Service Discovery**: `TagResource`, `UntagResource`, `ListTagsForResource`
- **Route53**: `DeleteHostedZone`, `ListHostedZones`, `GetChange`, `ChangeTagsForResource`, `ListTagsForResource`
- **EC2**: `DescribeNetworkInterfaces`, `DeleteNetworkInterface`
- **Application Auto Scaling**: Full set of autoscaling permissions

**Impact**: Enables complete Terraform lifecycle management including `terraform destroy` and autoscaling.

---

### 3. **Enabled Remote S3 State Backend**
**Files**: 
- `infra/terraform/main.tf`
- `infra/scripts/setup-terraform-backend.sh` (new)

**Changes**:
- Enabled S3 backend configuration with:
  - Bucket: `mayday-terraform-state-390299133544`
  - DynamoDB table: `mayday-terraform-locks` (for state locking)
  - Server-side encryption enabled
  - Versioning enabled
  - Public access blocked
- Created setup script to automate S3 bucket and DynamoDB table creation

**Impact**: 
- Terraform state is now securely stored remotely
- Enables team collaboration
- State locking prevents concurrent modifications
- Versioning enables rollback if needed

**Usage**:
```bash
cd infra/scripts
./setup-terraform-backend.sh
```

---

### 4. **Created Private Subnets for Database**
**Files**: 
- `infra/terraform/modules/common/main.tf`
- `infra/terraform/modules/common/variables.tf`
- `infra/terraform/modules/common/outputs.tf`
- `infra/terraform/variables.tf`
- `infra/terraform/main.tf`
- `infra/terraform/modules/database/main.tf`

**Changes**:
- Added 2 private subnets (10.0.10.0/24, 10.0.11.0/24)
- Created NAT Gateway in first public subnet
- Created private route table routing through NAT
- Moved database service to private subnets
- Removed public IP assignment from database (`assign_public_ip = false`)

**Network Architecture**:
```
Internet → IGW → Public Subnets (10.0.1.0/24, 10.0.2.0/24)
                  ↓ NAT Gateway
                  Private Subnets (10.0.10.0/24, 10.0.11.0/24) → Database
```

**Impact**: 
- Database is no longer directly accessible from internet
- Follows AWS best practices for multi-tier architecture
- Database can still reach internet for updates via NAT Gateway

---

### 5. **Added ALB Routing for Frontend/SUV UI**
**Files**: 
- `infra/terraform/modules/common/main.tf`
- `infra/terraform/modules/common/outputs.tf`
- `infra/terraform/modules/frontend/main.tf`
- `infra/terraform/modules/frontend/variables.tf`
- `infra/terraform/modules/suv_ui/main.tf`
- `infra/terraform/modules/suv_ui/variables.tf`
- `infra/terraform/main.tf`

**Changes**:
- Created ALB target group for frontend (port 3000)
- Created ALB target group for SUV UI (port 3030)
- Added path-based routing:
  - `/dashboard` and `/dashboard/*` → Frontend
  - `/suv` and `/suv/*` → SUV UI
  - Default → API Service
- Connected frontend and SUV UI services to their respective target groups

**Routing Configuration**:
```
http://<alb-dns-name>/          → API Service (port 8000)
http://<alb-dns-name>/dashboard → Frontend (port 3000)
http://<alb-dns-name>/suv       → SUV UI (port 3030)
```

**Impact**: All services now accessible through single ALB endpoint with path-based routing.

---

### 7. **Fixed Next.js Configuration for Path-Based Routing**
**Files**:
- `frontend/next.config.ts`
- `suv_ui/next.config.ts`

**Changes**:
- Added `basePath: '/dashboard'` to frontend configuration
- Added `basePath: '/suv'` to SUV UI configuration
- Added `trailingSlash: false` for consistent URL handling

**Impact**: Static assets and navigation now work correctly with ALB path-based routing.

---

### 8. **Fixed API URL Configuration**
**Files**:
- `frontend/lib/api-client.ts`
- `suv_ui/lib/api-client.ts`
- `.github/workflows/build-and-push-ecr.yml`

**Changes**:
- Added validation to ensure `NEXT_PUBLIC_API_URL` includes protocol (`http://` or `https://`)
- Added automatic trailing slash removal
- Added debug logging for API base URL
- Updated GitHub Actions workflow to validate `API_URL` variable is set
- Removed fallback URL to force proper configuration

**Impact**: 
- Build fails early with clear error if API URL is misconfigured
- Prevents double-domain issues from missing protocol
- Ensures consistent API URL formatting

---

### 9. **Fixed SUV UI Port Configuration**
**File**: `infra/terraform/modules/suv_ui/main.tf`

**Changes**:
- Added `PORT=3030` environment variable to SUV UI task definition

**Impact**: 
- Next.js standalone server now listens on port 3030 (matching container port mapping)
- Health checks pass correctly
- Fixes 502 Bad Gateway errors

---

### 6. **Increased Service Count & Enabled Autoscaling**
**Files**: 
- `infra/terraform/modules/api_service/main.tf`
- `infra/terraform/modules/frontend/main.tf`
- `infra/terraform/modules/suv_ui/main.tf`

**Changes**:
- Increased `desired_count` from 1 to **2** for:
  - API Service
  - Frontend
  - SUV UI
- Added autoscaling configuration for each service:
  - **Min capacity**: 2 instances
  - **Max capacity**: 4 instances
  - **CPU-based scaling**: Scale out at 70% CPU
  - **Memory-based scaling**: Scale out at 80% memory
  - **Scale-in cooldown**: 5 minutes
  - **Scale-out cooldown**: 1 minute

**Impact**: 
- High availability across 2 availability zones
- Automatic scaling based on load
- Better resilience to failures
- Can handle traffic spikes automatically

---

## 📋 Additional Notes

### Health Check Verified
✅ The API service has a `/health` endpoint defined in `api_service/app/main.py` (line 59)

### Database Storage
⚠️ **Still requires attention**: Database uses ephemeral container storage. Consider:
- Migrating to Amazon RDS for persistent storage
- Or adding EFS volume for container-based PostgreSQL

### Secrets Management
ℹ️ **Note**: As requested, assuming secrets will be stored in GitHub repository secrets.
- For production, consider migrating to AWS Secrets Manager
- Update IAM policies accordingly if switching to Secrets Manager

---

## 🚀 Deployment Steps

### Initial Setup (One-time)

1. **Set up S3 backend**:
   ```bash
   cd infra/scripts
   ./setup-terraform-backend.sh
   ```

2. **Initialize Terraform**:
   ```bash
   cd ../terraform
   terraform init -migrate-state  # If migrating existing state
   # OR
   terraform init  # If starting fresh
   ```

3. **Review and apply changes**:
   ```bash
   terraform plan
   terraform apply
   ```

### Expected Cost Impact

With these changes:
- **Old**: 4 Fargate tasks (1 each)
- **New**: 8 Fargate tasks (2 each) + NAT Gateway

**Estimated monthly cost**: ~$120-150 USD (was ~$50-80)
- Additional tasks: ~$40-50
- NAT Gateway: ~$32/month + data transfer
- DynamoDB (on-demand): ~$1/month

---

## 🔍 Testing Checklist

Before deploying to production:

- [ ] Verify S3 backend setup successful
- [ ] Test `terraform plan` completes without errors
- [ ] Test `terraform apply` creates all resources
- [ ] Verify services register with ALB target groups
- [ ] Test API endpoint: `http://<alb-dns>/health`
- Test Frontend routing: `http://<alb-dns>/dashboard`
- [ ] Test SUV UI routing: `http://<alb-dns>/suv`
- [ ] Verify static assets load (no 404 for JS/CSS files)
- [ ] Verify API calls work from frontend/SUV UI
- [ ] Verify database connectivity from API service
- [ ] Monitor autoscaling triggers (simulate load)
- [ ] Test `terraform destroy` works (in dev environment)

---

## 📝 Files Modified

### Created:
- `infra/scripts/setup-terraform-backend.sh`

### Modified:
- `infra/terraform/main.tf`
- `infra/terraform/variables.tf`
- `infra/iam-policies/setup-infrastructure-policy.json`
- `infra/terraform/modules/common/main.tf`
- `infra/terraform/modules/common/variables.tf`
- `infra/terraform/modules/common/outputs.tf`
- `infra/terraform/modules/database/main.tf`
- `infra/terraform/modules/api_service/main.tf`
- `infra/terraform/modules/frontend/main.tf`
- `infra/terraform/modules/frontend/variables.tf`
- `infra/terraform/modules/suv_ui/main.tf`
- `infra/terraform/modules/suv_ui/variables.tf`

---

## ⚠️ Breaking Changes

1. **Path-based routing**: Frontend and SUV UI now accessible via paths instead of root URL
   - Frontend: `/dashboard` with `basePath: '/dashboard'` in next.config.ts
   - SUV UI: `/suv` with `basePath: '/suv'` in next.config.ts
   - **Docker images must be rebuilt** after changing basePath

2. **API URL Configuration**: `NEXT_PUBLIC_API_URL` must include protocol
   - Set GitHub variable `API_URL` to full URL: `http://your-alb-dns.amazonaws.com`
   - Build will fail with clear error if protocol is missing

3. **Private subnets**: Database no longer has public IP
   - Bastion host or VPN required for direct database access
   - Use service discovery (`db.mayday-cluster.local`) from other services

3. **Increased task count**: Costs will increase due to more running tasks

---

## ✅ Recently Fixed Issues

1. **SUV UI 502 Bad Gateway** - Fixed by adding `PORT=3030` environment variable
2. **Frontend static asset 404s** - Fixed by adding `basePath` configuration
3. **API URL duplication** - Fixed by enforcing protocol in `NEXT_PUBLIC_API_URL`
4. **Routing not working** - Fixed by adding basePath to Next.js configs

## 🎯 Remaining Recommendations

For future improvements:
1. Migrate database to Amazon RDS
2. Implement HTTPS with ACM certificate
3. Add AWS WAF for additional security
4. Set up CloudWatch alarms
5. Implement proper backup strategy
6. Use specific Docker image tags instead of `:latest`
7. Add health check endpoints to frontend/SUV UI

---

## 📞 Support

For questions or issues:
- Review Terraform plan output carefully
- Check CloudWatch logs for service issues
- Verify security group rules if connectivity issues occur

---

**Status**: ✅ Ready for Review
**Next Step**: Please review these changes before deploying to AWS
