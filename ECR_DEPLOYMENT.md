# AWS ECR Deployment Guide

This repository includes automated deployment to AWS ECR (Elastic Container Registry) via GitHub Actions.

## 🚀 Services

The following Docker services are automatically built and pushed to ECR:
- **api_service** - Backend API service
- **frontend** - Main frontend application
- **suv_ui** - SUV UI application

## 📋 Prerequisites

### 1. AWS Account Setup

You need an AWS account with ECR access. The GitHub Actions workflow will automatically create ECR repositories if they don't exist.

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | Create in AWS IAM Console |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | Create in AWS IAM Console |

#### Creating AWS IAM User for GitHub Actions

1. Go to AWS IAM Console
2. Create a new user (e.g., `github-actions-ecr`)
3. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:CreateRepository",
                "ecr:DescribeRepositories"
            ],
            "Resource": "*"
        }
    ]
}
```

4. Save the Access Key ID and Secret Access Key
5. Add them to GitHub Secrets

### 3. Configure AWS Region

Edit `.github/workflows/deploy-to-ecr.yml` and change the AWS_REGION:

```yaml
env:
  AWS_REGION: us-east-1  # Change to your preferred region
```

## 🔄 How It Works

### Automatic Deployment

The workflow triggers automatically when:
- **New GitHub Release** is published
- **Manual trigger** via GitHub Actions UI (for testing)

This ensures only stable, versioned code is deployed to production.

### Image Tagging Strategy

Images are tagged with semantic versions from your GitHub release:
- `latest` - Latest production release
- `<version>` - Exact version (e.g., `1.2.3`)
- `<major>.<minor>` - Minor version (e.g., `1.2`)
- `<major>` - Major version (e.g., `1`)

**Example:** Release `v1.2.3` creates tags: `1.2.3`, `1.2`, `1`, and `latest`

### Build Process

1. **Checkout** - Clone the repository
2. **Setup Docker Buildx** - Configure Docker build environment
3. **AWS Authentication** - Login using GitHub secrets
4. **ECR Login** - Authenticate Docker with ECR
5. **Create Repository** - Create ECR repo if it doesn't exist
6. **Build & Push** - Build and push images in parallel
7. **Summary** - Display deployment summary

## 🖥️ Manual Deployment (Local)

If you want to push images manually from your local machine, use the provided script:

```bash
# Make script executable (first time only)
chmod +x push_to_ecr.sh

# Run the script
./push_to_ecr.sh <aws-region> <aws-account-id>

# Example
./push_to_ecr.sh us-east-1 123456789012
```

### Prerequisites for Manual Push

1. Install AWS CLI
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

2. Configure AWS credentials
```bash
aws configure
```

3. Build your Docker images
```bash
docker compose build
```

4. Run the push script
```bash
./push_to_ecr.sh us-east-1 YOUR_ACCOUNT_ID
```

## 📥 Pulling Images from ECR

To use the images on another machine or in production:

```bash
# 1. Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 2. Pull an image
docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/api_service:latest
docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/suv_ui:latest
```

## 🔧 Using ECR Images in Production

Update your `compose.yaml` or production deployment to use ECR images:

```yaml
services:
  api_service:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/api_service:latest
    # ... rest of config

  frontend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
    # ... rest of config

  suv_ui:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/suv_ui:latest
    # ... rest of config
```

## 🎯 Creating a Release

To deploy your images to ECR, create a new GitHub release:

1. Go to your repository → **Releases** → **Draft a new release**
2. Create a new tag (e.g., `v1.0.0`)
3. Add release notes describing changes
4. Click **Publish release**
5. GitHub Actions will automatically build and push all images

**See [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) for detailed instructions.**

## 📊 Monitoring Deployments

1. Go to GitHub Actions tab in your repository
2. Click on "Build and Push to AWS ECR" workflow
3. View the status and logs of each deployment
4. Check the deployment summary for release version and tags

## 🛠️ Troubleshooting

### Authentication Failed
- Check AWS credentials in GitHub Secrets
- Verify IAM user has correct permissions
- Ensure AWS region is correct

### Build Failed
- Check Dockerfile syntax
- Verify all required files exist in build context
- Review GitHub Actions logs for specific error

### Push Failed
- Verify ECR repository exists or can be created
- Check network connectivity
- Ensure image size is within limits

## 🔒 Security Best Practices

1. **Never commit AWS credentials** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Enable image scanning** in ECR (already configured)
4. **Enable encryption** for ECR repositories (already configured)
5. **Rotate AWS credentials** regularly
6. **Use least-privilege IAM policies**

## 📝 Additional Configuration

### Adding More Services

To add another service to the workflow, edit `.github/workflows/deploy-to-ecr.yml`:

```yaml
strategy:
  matrix:
    service:
      - name: api_service
        context: .
        dockerfile: api_service/Dockerfile
      # Add new service here
      - name: new_service
        context: ./new_service
        dockerfile: ./new_service/Dockerfile
```

### Changing Trigger Branches

Edit the workflow file:

```yaml
on:
  push:
    branches:
      - main
      - your-branch  # Add your branch here
```

## 📞 Support

For issues related to:
- **AWS/ECR**: Check AWS documentation
- **GitHub Actions**: Check workflow logs
- **Docker**: Check Dockerfile and build logs

## 🎯 Next Steps

After setting up ECR deployment, consider:
1. Setting up ECS/EKS for container orchestration
2. Implementing CI/CD for automated testing
3. Setting up CloudWatch for monitoring
4. Implementing blue-green deployments
5. Adding automated rollback mechanisms
