#!/bin/bash
set -e

# -------- CONFIGURATION --------
AWS_REGION="us-east-1"                     # Change to your preferred region
ECR_API_REPO="my-api-repo"                 # ECR repo name for your API container
ECR_DB_REPO="my-db-repo"                   # ECR repo name for your DB container
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)" # Go up from scripts/
LAMBDA_DIR="$PROJECT_ROOT/lambda"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
ECS_DIR="$PROJECT_ROOT/ecs"

# -------- PRE-CHECKS --------
echo "🔍 Checking dependencies..."
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found. Install it first."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform not found. Install it first."; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "❌ zip not found. Install it first."; exit 1; }

# -------- BUILD LAMBDA PACKAGE --------
echo "📦 Packaging Lambda function..."
cd "$LAMBDA_DIR"
rm -f ../lambda.zip
zip -r ../lambda.zip . >/dev/null
echo "✅ Lambda package created: lambda.zip"

# -------- (OPTIONAL) BUILD & PUSH DOCKER IMAGES --------
read -p "🐳 Build and push ECS container images? (y/n): " build_images
if [[ "$build_images" == "y" ]]; then
  echo "🔑 Logging into Amazon ECR..."
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query 'Account' --output text).dkr.ecr.${AWS_REGION}.amazonaws.com"

  ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

  echo "🚀 Building API container..."
  docker build -t "${ECR_API_REPO}:latest" -f "$ECS_DIR/Dockerfile.api" "$ECS_DIR"
  docker tag "${ECR_API_REPO}:latest" "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_API_REPO}:latest"
  docker push "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_API_REPO}:latest"

  echo "🚀 Building DB container..."
  docker build -t "${ECR_DB_REPO}:latest" -f "$ECS_DIR/Dockerfile.db" "$ECS_DIR"
  docker tag "${ECR_DB_REPO}:latest" "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_DB_REPO}:latest"
  docker push "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_DB_REPO}:latest"

  echo "✅ Images pushed to ECR."
else
  echo "⏩ Skipping image build."
fi

# -------- DEPLOY WITH TERRAFORM --------
echo "🌍 Deploying infrastructure with Terraform..."
cd "$TERRAFORM_DIR"
terraform init -upgrade
terraform apply -auto-approve

# -------- OUTPUTS --------
echo ""
echo "✅ Deployment complete!"
terraform output
echo ""
echo "🎯 Check your API Gateway endpoint above to test the provisioning service."
