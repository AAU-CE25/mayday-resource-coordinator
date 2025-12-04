#!/bin/bash
# ECR Push Helper Script
# This script helps push Docker images to ECR repositories

set -e

# Configuration
AWS_REGION="eu-central-1"
AWS_ACCOUNT_ID="390299133544"
ECR_BASE_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ECR Image Push Helper ===${NC}\n"

# Authenticate to ECR
echo -e "${YELLOW}Step 1: Authenticating to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_BASE_URL}
echo -e "${GREEN}✓ Authentication successful${NC}\n"

# Function to build and push image
push_image() {
    local service_name=$1
    local dockerfile_path=$2
    local ecr_repo_name=$3
    
    echo -e "${YELLOW}Building and pushing ${service_name}...${NC}"
    
    # Build image
    docker build -t ${ecr_repo_name}:latest ${dockerfile_path}
    
    # Tag image
    docker tag ${ecr_repo_name}:latest ${ECR_BASE_URL}/${ecr_repo_name}:latest
    
    # Push image
    docker push ${ECR_BASE_URL}/${ecr_repo_name}:latest
    
    echo -e "${GREEN}✓ ${service_name} pushed successfully${NC}\n"
}

# Push all images
echo -e "${BLUE}Step 2: Building and pushing images...${NC}\n"

# API Service
if [ -d "../../api_service" ]; then
    push_image "API Service" "../../api_service" "mayday-api"
else
    echo -e "${YELLOW}⚠ API Service directory not found, skipping...${NC}\n"
fi

# Frontend
if [ -d "../../frontend" ]; then
    push_image "Frontend" "../../frontend" "mayday-frontend"
else
    echo -e "${YELLOW}⚠ Frontend directory not found, skipping...${NC}\n"
fi

# SUV UI
if [ -d "../../suv_ui" ]; then
    push_image "SUV UI" "../../suv_ui" "mayday-suv-ui"
else
    echo -e "${YELLOW}⚠ SUV UI directory not found, skipping...${NC}\n"
fi

# Database (if custom image exists)
if [ -f "../../api_service/Dockerfile.db" ]; then
    push_image "Database" "../../api_service" "mayday-db"
else
    echo -e "${YELLOW}⚠ Database Dockerfile not found, using official postgres:18 instead${NC}\n"
fi

echo -e "${GREEN}=== All images pushed successfully! ===${NC}"
echo -e "\nYou can now deploy the ECS services with the new images."
