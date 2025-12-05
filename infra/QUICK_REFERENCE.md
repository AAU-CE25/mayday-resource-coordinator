# Quick Reference - Infrastructure Changes

## 🔄 What Changed?

### Security ✅
- **Security Groups**: Only port 80 (ALB) is public. All service ports (3000, 3030, 8000, 5432) are now internal-only
- **Database**: Moved to private subnets with no public IP
- **IAM**: Added complete permissions for full Terraform lifecycle

### High Availability ✅
- **Service Count**: All services now run 2 instances (was 1)
- **Autoscaling**: CPU and memory-based autoscaling configured (2-4 instances)
- **Multi-AZ**: Services distributed across 2 availability zones

### Infrastructure Management ✅
- **Remote State**: S3 backend with DynamoDB locking enabled
- **Network**: Private subnets + NAT Gateway for database isolation
- **Load Balancing**: Path-based routing for all services through single ALB

---

## 🌐 Service Access

After deployment, all services accessible via ALB:

```
http://<alb-dns-name>/          → API Service
http://<alb-dns-name>/dashboard → Frontend Dashboard
http://<alb-dns-name>/suv       → Volunteer UI (SUV Portal)
```

Get ALB DNS: `terraform output alb_dns_name`

---

## 📦 Network Architecture

```
                    Internet
                       │
                   [IGW]
                       │
        ┌──────────────┴──────────────┐
        │      Public Subnets         │
        │   10.0.1.0/24, 10.0.2.0/24  │
        │                             │
        │  ┌─────┐  ┌──────────────┐ │
        │  │ NAT │  │     ALB      │ │
        │  └──┬──┘  │   (port 80)  │ │
        │     │     └──────┬───────┘ │
        └─────┼────────────┼─────────┘
              │            │
              │       ┌────┴────┐
              │       │ Target  │
              │       │ Groups  │
              │       └────┬────┘
              │            │
        ┌─────┴────────────┴─────────┐
        │     Private Subnets        │
        │ 10.0.10.0/24, 10.0.11.0/24 │
        │                            │
        │  ┌──────────┐             │
        │  │ Database │             │
        │  │ (port    │             │
        │  │  5432)   │             │
        │  └──────────┘             │
        └────────────────────────────┘
```

---

## 🚀 Deployment Commands

### First Time Setup

```bash
# 1. Setup S3 backend
cd infra/scripts
./setup-terraform-backend.sh

# 2. Initialize Terraform
cd ../terraform
terraform init -migrate-state

# 3. Review changes
terraform plan

# 4. Deploy
terraform apply
```

### Updates

```bash
cd infra/terraform
terraform plan    # Review
terraform apply   # Deploy
```

### Get Outputs

```bash
terraform output                 # All outputs
terraform output alb_dns_name    # Just ALB DNS
```

---

## 📊 Resource Count

| Resource | Before | After | Notes |
|----------|--------|-------|-------|
| ECS Tasks | 4 | 8 | 2x for HA |
| Subnets | 2 public | 2 public + 2 private | DB isolation |
| NAT Gateways | 0 | 1 | Private subnet internet access |
| ALB Target Groups | 1 | 3 | API + Frontend + SUV UI |
| Autoscaling Policies | 0 | 6 | 2 per service (CPU + Memory) |

---

## 💰 Cost Impact

| Item | Monthly Cost |
|------|-------------|
| ECS Tasks (8x) | ~$90 |
| NAT Gateway | ~$32 |
| ALB | ~$16 |
| CloudWatch Logs | ~$5 |
| S3 + DynamoDB | ~$2 |
| **Total** | **~$145/month** |

Previous: ~$60/month  
Increase: ~$85/month for HA and security improvements

---

## ⚙️ Autoscaling Configuration

All services (API, Frontend, SUV UI):

- **Min**: 2 instances
- **Max**: 4 instances  
- **CPU trigger**: 70% utilization
- **Memory trigger**: 80% utilization
- **Scale out**: 1 minute cooldown
- **Scale in**: 5 minutes cooldown

---

## 🔐 Security Improvements

| Port | Service | Before | After |
|------|---------|--------|-------|
| 80 | ALB | Public ✅ | Public ✅ |
| 8000 | API | Public ❌ | Internal ✅ |
| 3000 | Frontend | Public ❌ | Internal ✅ |
| 3030 | SUV UI | Public ❌ | Internal ✅ |
| 5432 | Database | Public ❌ | Private Subnet ✅ |

---

## 🧪 Testing Endpoints

After `terraform apply`:

```bash
# Get ALB DNS
ALB_DNS=$(terraform output -raw alb_dns_name)

# Test API
curl http://$ALB_DNS/health

# Test Frontend (should see HTML)
curl http://$ALB_DNS/dashboard

# Test SUV UI (should see HTML)
curl http://$ALB_DNS/suv

# Check service health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw alb_target_group_arn)
```

---

## 📝 Key Files Changed

### Infrastructure
- `terraform/main.tf` - S3 backend, module configurations
- `terraform/variables.tf` - Added private_subnet_cidrs
- `modules/common/main.tf` - Security groups, private subnets, NAT, ALB routing
- `modules/database/main.tf` - Private subnet, no public IP
- `modules/api_service/main.tf` - Autoscaling, desired_count=2
- `modules/frontend/main.tf` - ALB integration, autoscaling, desired_count=2
- `modules/suv_ui/main.tf` - ALB integration, autoscaling, desired_count=2

### IAM & Scripts
- `iam-policies/setup-infrastructure-policy.json` - Complete permissions
- `scripts/setup-terraform-backend.sh` - S3 backend setup automation

---

## ⚠️ Important Notes

2. **Path Routing**: Frontend and SUV UI use path prefixes
   - Frontend: `basePath: '/dashboard'` in `next.config.ts`
   - SUV UI: `basePath: '/suv'` in `next.config.ts`
   - These must match the ALB path routing rules
   - Rebuild Docker images after changing basePath

2. **Database Access**: Database is in private subnet
   - Access via other ECS services using: `db.mayday-cluster.local:5432`
   - No direct external access (by design for security)
   - Use bastion host or VPN for admin access if needed

3. **Terraform State**: Now stored in S3
   - Don't commit `terraform.tfstate` files
   - State locked during operations
   - Safe for team collaboration

4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Must include protocol (`http://` or `https://`)
   - `PORT`: Set to `3030` for SUV UI to match container port mapping
   - Both are set in Terraform task definitions

5. **Cost**: Monthly cost increased for production-ready setup
   - Can reduce to `desired_count = 1` for dev environment
   - Can remove autoscaling for dev environment

---

## 🐛 Troubleshooting

### Service fails health check
```bash
# Check service logs
aws logs tail /ecs/mayday-cluster/api_service --follow
aws logs tail /ecs/mayday-cluster/frontend --follow
```

### Can't access services
- Verify security group allows traffic from ALB
- Check target group health status
- Verify services registered with target groups

### Terraform errors
- Ensure S3 backend is set up: `./setup-terraform-backend.sh`
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions are updated

---

## 📚 Related Documentation

- Full changes: `infra/CHANGES_SUMMARY.md`
- IAM setup: `infra/iam-policies/README.md`
- Terraform: `infra/terraform/README.md`

---

**Version**: 1.0  
**Date**: December 4, 2025  
**Status**: ✅ Ready for Deployment
