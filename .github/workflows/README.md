# GitHub Actions Workflows

This directory contains CI/CD workflows for the Mayday Resource Coordinator project.

## Workflows Overview

### 1. **build-and-push-ecr.yml** - Build and Push Docker Images to ECR

Builds Docker images and pushes them to Amazon ECR repositories.

**Triggers:**
- Push to `main` or `develop` branches (when service files change)
- Manual workflow dispatch

**What it does:**
- Builds Docker images for API, Frontend, and SUV UI
- Tags images with branch name, commit SHA, and `latest`
- Pushes images to ECR repositories
- Uses Docker layer caching for faster builds

**Manual trigger:**
```bash
# Via GitHub UI: Actions → Build and Push to ECR → Run workflow
# Select services: api, frontend, suv-ui, or all
```

**Required Secrets:**
- `AWS_ACCESS_KEY_ID_KAJ` - AWS access key with ECR push permissions
- `AWS_SECRET_ACCESS_KEY_KAJ` - AWS secret key

**Required Variables:**
- `AWS_ACCOUNT_ID_KAJ` - Your AWS account ID (390299133544)
- `API_URL` - API URL with protocol (e.g., `http://mayday-cluster-api-alb-xxx.eu-central-1.elb.amazonaws.com`)

---

### 2. **deploy-to-ecs.yml** - Deploy Services to ECS

Deploys updated services to ECS Fargate after images are pushed.

**Triggers:**
- Manual workflow dispatch only (for controlled deployments)

**What it does:**
- Forces new deployment of selected ECS services
- Waits for services to stabilize
- Shows service status and ALB URLs

**Manual trigger:**
```bash
# Via GitHub UI: Actions → Deploy to ECS → Run workflow
# Select environment: production or staging
# Select services: api, frontend, suv-ui, database, or all
```

**Required Secrets:**
- `AWS_ACCESS_KEY_ID` - AWS access key with ECS deployment permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_ACCOUNT_ID` - Your AWS account ID

---

### 3. **terraform.yml** - Terraform Infrastructure Management

Manages AWS infrastructure using Terraform.

**Triggers:**
- Push to `main` (when Terraform files change) - runs plan
- Pull requests - runs plan and comments on PR
- Manual workflow dispatch - can run plan, apply, or destroy

**What it does:**
- Validates Terraform configuration
- Plans infrastructure changes
- Applies changes (manual only)
- Runs security scans (tfsec, Checkov)
- Comments plan on pull requests

**Manual trigger:**
```bash
# Via GitHub UI: Actions → Terraform Infrastructure → Run workflow
# Select action: plan, apply, or destroy
```

**Required Secrets:**
- `AWS_ACCESS_KEY_ID` - AWS access key with infrastructure permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_ACCOUNT_ID` - Your AWS account ID
- `POSTGRES_PASSWORD` - Database password

---

### 4. **test.yaml** - Automated Tests

Runs automated tests for backend and frontend.

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**What it does:**
- Runs backend tests with pytest
- Uploads coverage reports to Codecov
- (Frontend tests currently commented out)

---

## When Do Workflows Run?

Understanding when each workflow triggers is crucial for efficient CI/CD operations.

### Automatic Triggers

| Workflow | Trigger Event | Condition | What Happens |
|----------|--------------|-----------|--------------|
| **terraform.yml** | Push to `main` | Terraform files changed (`infra/terraform/**`) | Runs `terraform plan` only |
| **terraform.yml** | Pull Request | Any PR with Terraform changes | Runs `terraform plan` and comments on PR |
| **build-and-push-ecr.yml** | Push to `main` or `feature/MDAY-44-cloud-deployment` | Service files changed | Builds and pushes affected service images |
| **test.yaml** | Push to `main` or `develop` | Any code changes | Runs backend tests |
| **test.yaml** | Pull Request to `main` or `develop` | Any code changes | Runs backend tests |

### Change Detection for build-and-push-ecr.yml

The build workflow uses path filters to detect which services need rebuilding:

```yaml
# Triggers build only if these files change:
api:
  - 'api_service/**'
  - 'domain/**'
  - '.github/workflows/build-and-push-ecr.yml'

frontend:
  - 'frontend/**'
  - '.github/workflows/build-and-push-ecr.yml'

suv-ui:
  - 'suv_ui/**'
  - '.github/workflows/build-and-push-ecr.yml'
```

**Examples:**
- ✅ Change `api_service/app/main.py` → Builds only API image
- ✅ Change `frontend/components/dashboard.tsx` → Builds only Frontend image
- ✅ Change `suv_ui/app/page.tsx` → Builds only SUV UI image
- ✅ Change multiple service files → Builds all affected images in parallel
- ❌ Change `README.md` → No builds triggered

### Manual Triggers

All workflows can be triggered manually via GitHub Actions UI:

| Workflow | Manual Options | Use Case |
|----------|---------------|----------|
| **build-and-push-ecr.yml** | Select services: `api`, `frontend`, `suv-ui`, or `all` | Force rebuild without code changes |
| **deploy-to-ecs.yml** | Select environment + services | Deploy after manual testing |
| **terraform.yml** | Select action: `plan`, `apply`, or `destroy` | Infrastructure changes |
| **test.yaml** | No options (runs all tests) | Verify tests after fixes |

### Workflow Execution Order

**Typical deployment flow:**

1. **Developer pushes code** → `test.yaml` runs automatically
2. **If tests pass** → `build-and-push-ecr.yml` runs (if service files changed)
3. **Images built and pushed** → Manual trigger of `deploy-to-ecs.yml`
4. **Services updated** → New containers running with latest images

**Infrastructure changes flow:**

1. **Developer pushes Terraform changes** → `terraform.yml` runs `plan`
2. **Review plan output** → If approved, manually trigger `apply`
3. **Infrastructure updated** → Services restart if needed

### Important Notes

⚠️ **deploy-to-ecs.yml** is **MANUAL ONLY** by design:
- Prevents accidental production deployments
- Allows review of built images before deployment
- Enables deployment during maintenance windows

⚠️ **terraform.yml** applies are **MANUAL ONLY**:
- `plan` runs automatically on push/PR
- `apply` must be manually triggered
- Prevents accidental infrastructure destruction

### Quick Reference: Common Scenarios

| What You Want | What Runs Automatically | What You Need to Trigger Manually |
|---------------|-------------------------|-----------------------------------|
| Deploy code change to API | `test.yaml`, `build-and-push-ecr.yml` (API only) | `deploy-to-ecs.yml` (select API) |
| Deploy all services | `test.yaml`, `build-and-push-ecr.yml` (all changed) | `deploy-to-ecs.yml` (select all) |
| Change infrastructure | `terraform.yml` (plan only) | `terraform.yml` (apply) |
| Rebuild without code change | Nothing | `build-and-push-ecr.yml` (select services) |
| Update single service | Nothing if no code changed | `build-and-push-ecr.yml` → `deploy-to-ecs.yml` |

---

## Setup Instructions

### 1. Configure GitHub Secrets and Variables

Go to **Settings → Secrets and variables → Actions** and add:

**Secrets:**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_ACCESS_KEY_ID_KAJ=AKIA...
AWS_SECRET_ACCESS_KEY_KAJ=...
POSTGRES_PASSWORD=your-secure-password
```

**Variables:**
```
AWS_ACCOUNT_ID=390299133544
AWS_ACCOUNT_ID_KAJ=390299133544
API_URL=http://your-alb-dns-name.eu-central-1.elb.amazonaws.com
```

**⚠️ Important Notes:**
- `API_URL` **must** include the protocol (`http://` or `https://`)
- `API_URL` should **not** have a trailing slash
- Frontend and SUV UI builds will fail if `API_URL` is not set correctly

### 2. IAM Permissions

Ensure your AWS IAM user has the required policies:
- `deploy-to-ecr-policy.json` - For build-and-push-ecr workflow
- `deploy-to-ecs-policy.json` - For deploy-to-ecs workflow
- `setup-infrastructure-policy.json` - For terraform workflow

See `infra/iam-policies/README.md` for detailed setup instructions.

### 3. First-Time Setup

1. **Create S3 backend for Terraform:**
   ```bash
   cd infra/scripts
   ./setup-terraform-backend.sh
   ```

2. **Deploy infrastructure:**
   - Go to Actions → Terraform Infrastructure → Run workflow
   - Select action: `apply`
   - Wait for completion (~10-15 minutes)

3. **Build and push initial images:**
   - Go to Actions → Build and Push to ECR → Run workflow
   - Select services: `all`
   - Wait for images to be pushed

4. **Deploy services:**
   - Go to Actions → Deploy to ECS → Run workflow
   - Select environment: `production`
   - Select services: `all`
   - Services will start with the new images

---

## Deployment Flow

### Standard Deployment Process

1. **Develop and test locally**
   ```bash
   docker-compose up
   # Make changes, test
   ```

2. **Create pull request**
   - Tests run automatically
   - Terraform plan posted to PR
   - Review changes

3. **Merge to main**
   - Automatic image build (if service files changed)
   - Images pushed to ECR with `latest` tag

4. **Deploy to ECS** (manual)
   - Trigger "Deploy to ECS" workflow
   - Select services to update
   - Wait for deployment to complete

### Hotfix Deployment

For urgent fixes:

1. **Build and push images:**
   ```bash
   # Trigger build-and-push-ecr workflow manually
   # Or use local script:
   cd infra/scripts
   ./push-to-ecr.sh
   ```

2. **Deploy immediately:**
   ```bash
   # Trigger deploy-to-ecs workflow
   # Select only affected service(s)
   ```

---

## Monitoring Deployments

### Check Workflow Status

- Go to **Actions** tab in GitHub
- Click on workflow run to see logs
- Each step shows detailed output

### Check ECS Service Status

```bash
aws ecs describe-services \
  --cluster mayday-cluster \
  --services mayday-cluster-api-service \
  --region eu-central-1
```

### View Service Logs

```bash
aws logs tail /ecs/mayday-cluster/api_service \
  --follow \
  --region eu-central-1
```

### Access Application

After deployment completes:
- API: `http://<alb-dns>/`
- Frontend: `http://<alb-dns>/dashboard`
- SUV UI: `http://<alb-dns>/suv`

Get ALB DNS from Terraform outputs:
```bash
cd infra/terraform
terraform output alb_dns_name
```

---

## Rollback Process

### Rollback to Previous Image

1. Find previous image tag:
   ```bash
   aws ecr describe-images \
     --repository-name mayday-api \
     --region eu-central-1 \
     --query 'sort_by(imageDetails,& imagePushedAt)[-5:]' \
     --output table
   ```

2. Update task definition with old image tag

3. Force new deployment:
   ```bash
   aws ecs update-service \
     --cluster mayday-cluster \
     --service mayday-cluster-api-service \
     --force-new-deployment
   ```

### Rollback Infrastructure

If Terraform changes cause issues:

1. Revert the Terraform code changes
2. Run Terraform workflow with action: `apply`
3. Or manually: `terraform apply` with previous code

---

## Troubleshooting

### Workflow Fails: "AWS credentials not configured"

**Solution:** Check GitHub secrets are set correctly
```bash
# Secrets should be set at repo level
Settings → Secrets and variables → Actions
```

### Image Push Fails: "Repository does not exist"

**Solution:** Run Terraform to create ECR repositories first
```bash
cd infra/terraform
terraform apply
```

### ECS Deployment Stuck

**Solution:** Check service events
```bash
aws ecs describe-services \
  --cluster mayday-cluster \
  --services mayday-cluster-api-service \
  --query 'services[0].events[0:5]'
```

Common issues:
- Image pull errors: Check ECR repository exists and image was pushed
- Health check failures: Check `/health` endpoint and container port configuration
- Port conflicts: Verify security group rules
- API URL errors: Ensure `API_URL` variable includes protocol (`http://` or `https://`)
- SUV UI port mismatch: Verify `PORT=3030` environment variable is set in task definition

### Terraform State Locked

**Solution:** Force unlock (use with caution)
```bash
cd infra/terraform
terraform force-unlock <lock-id>
```

---

## Best Practices

1. **Always test locally first:**
   ```bash
   docker-compose up
   # Test thoroughly
   ```

2. **Use pull requests:**
   - Get Terraform plan feedback
   - Run automated tests
   - Code review before merge

3. **Manual deploys for production:**
   - Review changes carefully
   - Deploy during low-traffic periods
   - Monitor logs after deployment

4. **Use semantic versioning for releases:**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   # Workflow will tag images accordingly
   ```

5. **Monitor costs:**
   - Check AWS Cost Explorer after infrastructure changes
   - Review ECR image count (lifecycle policy keeps last 10)
   - Monitor ECS task count and autoscaling

---

## Advanced Configuration

### Enable Automatic Deployment

To automatically deploy after image push, uncomment in `build-and-push-ecr.yml`:

```yaml
- name: Repository Dispatch
  uses: peter-evans/repository-dispatch@v2
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    event-type: deploy-to-ecs
```

And in `deploy-to-ecs.yml`, uncomment:

```yaml
on:
  repository_dispatch:
    types: [deploy-to-ecs]
```

### Add Slack Notifications

Add to any workflow:

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Enable Branch Deployments

Add environment-specific configurations:

```yaml
environment:
  name: ${{ github.ref_name }}
  url: http://${{ steps.deploy.outputs.alb_dns }}
```

---

## Support

For issues or questions:
1. Check workflow logs in Actions tab
2. Review AWS CloudWatch logs
3. Check ECS service events
4. Consult Terraform outputs
