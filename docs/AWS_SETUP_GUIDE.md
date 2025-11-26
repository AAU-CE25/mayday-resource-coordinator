# AWS Configuration Guide for ECR Deployment

This guide walks you through setting up AWS for pushing Docker images to ECR.

---

## 📋 Prerequisites

- An AWS account
- Basic understanding of IAM (Identity and Access Management)

---

## 🔧 Step-by-Step AWS Configuration

### Step 1: Create IAM User for ECR Access

1. **Sign in to AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Sign in with your root account or admin user

2. **Navigate to IAM**
   - Search for "IAM" in the top search bar
   - Click on "IAM" service

3. **Create a New User**
   - Click "Users" in the left sidebar
   - Click "Create user" button
   - **User name**: `github-actions-ecr` (or `your-name-ecr` for personal use)
   - **Access type**: Check "Provide user access to the AWS Management Console" (optional)
   - Click "Next"

4. **Set Permissions**
   - Select "Attach policies directly"
   - Search for and select the following managed policies:
     - `AmazonEC2ContainerRegistryPowerUser` (for ECR access)
     - OR create a custom policy (see below for minimal permissions)
   - Click "Next"

5. **Review and Create**
   - Review the settings
   - Click "Create user"

6. **Create Access Keys**
   - Click on the newly created user
   - Go to "Security credentials" tab
   - Scroll down to "Access keys"
   - Click "Create access key"
   - Select use case: "Command Line Interface (CLI)"
   - Check the confirmation box
   - Click "Next"
   - Add description tag: "ECR Push from local/GitHub Actions"
   - Click "Create access key"
   - **IMPORTANT**: Download the `.csv` file or copy both:
     - Access key ID
     - Secret access key
   - Store these securely! You won't be able to see the secret again.

---

### Step 2: Custom IAM Policy (Recommended for Security)

Instead of using the PowerUser policy, create a minimal policy:

1. **Go to IAM → Policies**
2. **Click "Create policy"**
3. **Click "JSON" tab**
4. **Paste this policy**:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECRAuthToken",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ECRRepositoryAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:CreateRepository",
                "ecr:ListImages",
                "ecr:DescribeImages"
            ],
            "Resource": "arn:aws:ecr:eu-central-1:YOUR_ACCOUNT_ID:repository/*"
        }
    ]
}
```

5. **Replace `YOUR_ACCOUNT_ID`** with your actual AWS account ID
6. **Click "Next"**
7. **Policy name**: `ECRPushPolicy`
8. **Description**: "Allow pushing Docker images to ECR"
9. **Click "Create policy"**
10. **Go back to your IAM user** and attach this policy

---

### Step 3: Configure AWS CLI on Your Local Machine

1. **Install AWS CLI** (if not already installed)
   ```bash
   # macOS
   brew install awscli
   
   # Verify installation
   aws --version
   ```

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```
   
   Enter the following when prompted:
   ```
   AWS Access Key ID [None]: YOUR_ACCESS_KEY_ID
   AWS Secret Access Key [None]: YOUR_SECRET_ACCESS_KEY
   Default region name [None]: eu-central-1
   Default output format [None]: json
   ```

3. **Verify Configuration**
   ```bash
   # Check your identity
   aws sts get-caller-identity
   
   # Should output:
   # {
   #     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
   #     "Account": "123456789012",
   #     "Arn": "arn:aws:iam::123456789012:user/github-actions-ecr"
   # }
   ```

4. **Get Your AWS Account ID** (you'll need this for the script)
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

---

### Step 4: Test ECR Access

1. **List ECR Repositories** (should work even if empty)
   ```bash
   aws ecr describe-repositories --region eu-central-1
   ```

2. **Test Authentication**
   ```bash
   aws ecr get-login-password --region eu-central-1 | \
     docker login --username AWS --password-stdin \
     $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-central-1.amazonaws.com
   ```
   
   Should output: `Login Succeeded`

---

### Step 5: (Optional) Create ECR Repositories Manually

If you want to create repositories before running the script:

1. **Via AWS Console**:
   - Go to Amazon ECR service
   - Click "Create repository"
   - Repository name: `api_service` (repeat for `frontend`, `suv_ui`)
   - Enable "Scan on push" (recommended)
   - Enable "KMS encryption" (optional, for extra security)
   - Click "Create repository"

2. **Via AWS CLI**:
   ```bash
   # Create repositories
   aws ecr create-repository --repository-name api_service --region eu-central-1
   aws ecr create-repository --repository-name frontend --region eu-central-1
   aws ecr create-repository --repository-name suv_ui --region eu-central-1
   ```

---

## 🔐 For GitHub Actions (Additional Setup)

If you're using GitHub Actions to push images:

### Step 1: Add Secrets to GitHub

1. **Go to Your GitHub Repository**
   - Navigate to: `https://github.com/AAU-CE25/mayday-resource-coordinator`

2. **Go to Settings → Secrets and variables → Actions**

3. **Click "New repository secret"**

4. **Add the following secrets**:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Your AWS access key ID

   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Your AWS secret access key

   **Secret 3 (Optional):**
   - Name: `AWS_ACCOUNT_ID`
   - Value: Your AWS account ID (12 digits)

### Step 2: Verify GitHub Actions Workflow

Your workflow file (`.github/workflows/deploy-to-ecr.yml`) should already be configured correctly with:
- Region: `eu-central-1` (check the `AWS_REGION` env variable)
- Credentials from secrets

---

## 🎯 Quick Reference

### Finding Your AWS Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

### Finding Your ECR Registry URL
```bash
echo "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-central-1.amazonaws.com"
```

### List ECR Images
```bash
aws ecr list-images --repository-name api_service --region eu-central-1
```

### Delete an Image (if needed)
```bash
aws ecr batch-delete-image \
  --repository-name api_service \
  --image-ids imageTag=latest \
  --region eu-central-1
```

---

## 🚨 Troubleshooting

### Error: "User is not authorized to perform: ecr:GetAuthorizationToken"
**Solution**: Attach the ECR policy to your IAM user (see Step 2 above)

### Error: "RepositoryNotFoundException"
**Solution**: The repository will be created automatically by the script, or create it manually (Step 5)

### Error: "denied: Your authorization token has expired"
**Solution**: Re-authenticate:
```bash
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com
```

### Error: "InvalidClientTokenId"
**Solution**: Your AWS credentials are invalid. Run `aws configure` again

### Error: "ExpiredToken"
**Solution**: If using temporary credentials (STS), refresh your session

### Docker Login Fails
**Solution**: Make sure Docker is running:
```bash
docker info
```

---

## 💰 Cost Considerations

### ECR Pricing (EU Central 1)
- **Storage**: $0.10 per GB per month
- **Data Transfer OUT**: 
  - First 1 GB/month: FREE
  - Up to 10 TB: $0.09 per GB
- **Data Transfer IN**: FREE

### Example Costs:
- **3 Docker images, ~1 GB each** = ~$0.30/month
- **Pulling images within AWS** = FREE
- **GitHub Actions pulls** = Minimal (first 1 GB free)

**Tip**: Delete old image versions to save costs:
```bash
# Keep only last 5 images
aws ecr list-images --repository-name api_service \
  --query 'imageIds[5:].[imageDigest]' --output text | \
  xargs -I {} aws ecr batch-delete-image \
    --repository-name api_service --image-ids imageDigest={}
```

---

## ✅ Verification Checklist

Before running the push script, verify:

- [ ] AWS CLI is installed (`aws --version`)
- [ ] AWS credentials are configured (`aws sts get-caller-identity`)
- [ ] Using `eu-central-1` region
- [ ] IAM user has ECR permissions
- [ ] Docker is running (`docker info`)
- [ ] You have your AWS Account ID

---

## 🎯 Next Steps

Once AWS is configured:

1. **Test the push script**:
   ```bash
   cd /path/to/mayday-resource-coordinator
   ./push_to_ecr.sh YOUR_ACCOUNT_ID
   ```

2. **For GitHub Actions**:
   - Add secrets to GitHub (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
   - Create a release to trigger the workflow
   - Monitor the Actions tab

3. **Update your deployment configs** to use ECR images:
   ```yaml
   image: YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/api_service:latest
   ```

---

## 📚 Additional Resources

- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [ECR IAM Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/security-iam.html)
- [ECR Best Practices](https://docs.aws.amazon.com/AmazonECR/latest/userguide/best-practices.html)

---

## 🔒 Security Best Practices

1. **Never commit AWS credentials** to Git
2. **Use IAM users** with minimal permissions (not root account)
3. **Enable MFA** on your AWS account
4. **Rotate access keys** regularly (every 90 days)
5. **Use AWS Secrets Manager** for production credentials
6. **Enable ECR image scanning** to detect vulnerabilities
7. **Enable ECR encryption** at rest
8. **Monitor CloudTrail** for ECR API calls
9. **Set up billing alerts** to avoid unexpected charges

---

Need help? Check the troubleshooting section or refer to the AWS documentation links above.
