# IAM Policies for GitHub Actions Workflows

This folder contains IAM policies for each GitHub Actions workflow. These follow the principle of least privilege - each policy grants only the permissions needed for that specific workflow.

## Policies Overview

| Policy | Workflow | Description |
|--------|----------|-------------|
| `github-terraform-networking-policy.json` | `terraform.yml` | Terraform - VPC, subnets, NAT, security groups, ALB |
| `github-terraform-services-policy.json` | `terraform.yml` | Terraform - ECS, ECR, IAM, CloudWatch, autoscaling |
| `github-terraform-ecr-policy.json` | `terraform-ecr.yml` | Terraform - ECR repositories only (standalone stack) |
| `github-ecr-push-policy.json` | `build-and-push-ecr.yml` | Build and push Docker images to ECR |
| `github-ecs-deploy-policy.json` | `deploy-to-ecs.yml` | Deploy services to ECS Fargate |

> **Note:** The main Terraform policy is split into two parts (networking + services) to stay within AWS's 6KB policy size limit. The ECR policy is separate for the standalone ECR stack.

## Automated Setup

Use the provided script to create/update all policies:

```bash
# Create new policies
./infra/scripts/setup-iam-policies.sh

# Update existing policies
./infra/scripts/setup-iam-policies.sh --update
```

The script will:
- Validate JSON syntax
- Create policies with `MDAY-` prefix
- Provide next steps for IAM user setup

## Policy Details

### Setup Infrastructure Policy

**Required for:** One-time infrastructure provisioning

**Permissions granted:**
- VPC management (create/describe/modify)
- Internet Gateway management
- Subnet management
- Route table management
- Security group management
- Application Load Balancer management
- ECS cluster creation
- IAM role creation for ECS task execution
- CloudWatch Log Groups creation
- Service Discovery namespace creation

### Deploy to ECR Policy

**Required for:** Building and pushing Docker images

**Permissions granted:**
- ECR repository management (create/describe)
- ECR image push operations
- ECR authentication token retrieval

**Restricted to repositories:**
- `api_service`
- `frontend`
- `suv_ui`

### Deploy to ECS Policy

**Required for:** Deploying services to ECS

**Permissions granted:**
- EC2 describe operations (for infrastructure lookup)
- Load balancer describe operations
- ECS task definition management
- ECS service management
- ECS task operations
- Service discovery service management
- CloudWatch Logs write access
- ECR image pull access

## Setup Instructions

### Option 1: Create Individual IAM Users

Create a separate IAM user for each workflow with only the required policy:

```bash
# Create users
aws iam create-user --user-name github-actions-infra
aws iam create-user --user-name github-actions-ecr
aws iam create-user --user-name github-actions-ecs

# Create and attach policies
aws iam create-policy \
  --policy-name MaydaySetupInfrastructure \
  --policy-document file://setup-infrastructure-policy.json

aws iam create-policy \
  --policy-name MaydayDeployToECR \
  --policy-document file://deploy-to-ecr-policy.json

aws iam create-policy \
  --policy-name MaydayDeployToECS \
  --policy-document file://deploy-to-ecs-policy.json

# Attach policies to users
aws iam attach-user-policy \
  --user-name github-actions-infra \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/MaydaySetupInfrastructure

aws iam attach-user-policy \
  --user-name github-actions-ecr \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/MaydayDeployToECR

aws iam attach-user-policy \
  --user-name github-actions-ecs \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/MaydayDeployToECS

# Create access keys for each user
aws iam create-access-key --user-name github-actions-infra
aws iam create-access-key --user-name github-actions-ecr
aws iam create-access-key --user-name github-actions-ecs
```

### Option 2: Single User with Combined Policy

For simplicity, create one user with all policies:

```bash
# Create user
aws iam create-user --user-name github-actions-mayday

# Create and attach all policies
for policy in setup-infrastructure deploy-to-ecr deploy-to-ecs; do
  aws iam create-policy \
    --policy-name Mayday-${policy} \
    --policy-document file://${policy}-policy.json
  
  aws iam attach-user-policy \
    --user-name github-actions-mayday \
    --policy-arn arn:aws:iam::ACCOUNT_ID:policy/Mayday-${policy}
done

# Create access key
aws iam create-access-key --user-name github-actions-mayday
```

### Option 3: Use OIDC (Recommended for Production)

Use OpenID Connect for passwordless authentication:

```bash
# Create OIDC provider for GitHub
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create role with trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:AAU-CE25/mayday-resource-coordinator:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name GitHubActions-Mayday \
  --assume-role-policy-document file://trust-policy.json
```

## GitHub Secrets Configuration

After creating the IAM user(s), add credentials to GitHub:

1. Go to **Repository Settings → Secrets and variables → Actions**
2. Add secrets:
   - `AWS_ACCESS_KEY_ID_KAJ` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY_KAJ` - Your AWS secret key
3. Add variables:
   - `AWS_ACCOUNT_ID_KAJ` - Your AWS account ID

## Security Best Practices

1. **Use least privilege** - Each workflow has only the permissions it needs
2. **Use resource constraints** - Policies limit actions to specific resources where possible
3. **Rotate credentials** - Regularly rotate IAM access keys
4. **Enable MFA** - Require MFA for IAM users with console access
5. **Use OIDC** - For production, use OIDC instead of long-lived credentials
6. **Monitor usage** - Enable CloudTrail to monitor API calls

## Updating Policies

When adding new AWS services or operations to workflows:

1. Identify the minimum required permissions
2. Add them to the appropriate policy file
3. Update the policy in AWS:

```bash
aws iam create-policy-version \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/PolicyName \
  --policy-document file://policy.json \
  --set-as-default
```

## Troubleshooting

### Permission Denied Errors

1. Check CloudTrail logs for the specific API call that failed
2. Verify the action is in the correct policy
3. Check resource ARN patterns match your naming convention

### Common Issues

| Error | Solution |
|-------|----------|
| `AccessDenied` on ECR push | Ensure `ecr:GetAuthorizationToken` has `Resource: "*"` |
| `PassRole` error | Add the specific role ARN to IAM policy |
| Service Discovery fails | Ensure Route53 permissions are included |
