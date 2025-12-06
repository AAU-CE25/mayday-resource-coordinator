#!/bin/bash
# ECR Push Helper Script
# This script helps push Docker images to ECR repositories

set -e

# Configuration
AWS_REGION="eu-central-1"
AWS_ACCOUNT_ID="390299133544"
ECR_BASE_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# API URL for frontend builds (from Terraform output)
API_URL="http://mayday-cluster-api-alb-308186494.eu-central-1.elb.amazonaws.com/api"

# Repo root (two levels up from infra/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

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
    local service_dir=$2   # relative to repo root, e.g. api_service
    local ecr_repo_name=$3
    local use_service_context=$4  # "true" to build from service dir, "false" for repo root
    local build_args=$5  # optional: additional build args

    echo -e "${YELLOW}Building and pushing ${service_name}...${NC}"

    local dockerfile_path="${REPO_ROOT}/${service_dir}/Dockerfile"
    if [[ ! -f "${dockerfile_path}" ]]; then
        echo -e "${YELLOW}⚠ Dockerfile not found for ${service_name} at ${dockerfile_path}, skipping...${NC}\n"
        return 0
    fi

    # Choose build context based on Dockerfile requirements
    local build_context
    if [[ "${use_service_context}" == "true" ]]; then
        # Frontend/SUV UI: build from service directory (they COPY . .)
        build_context="${REPO_ROOT}/${service_dir}"
        # Build for linux/amd64 platform (ECS Fargate requirement)
        docker build --platform linux/amd64  --no-cache -t ${ecr_repo_name}:latest -f "${dockerfile_path}" ${build_args} "${build_context}"
    else
        # API: build from repo root (it COPYs api_service and domain from root)
        build_context="${REPO_ROOT}"
        # Build for linux/amd64 platform (ECS Fargate requirement)
        docker build --platform linux/amd64 --no-cache -t ${ecr_repo_name}:latest -f "${dockerfile_path}" ${build_args} "${build_context}"
    fi

    # Tag image with ECR repo
    docker tag ${ecr_repo_name}:latest ${ECR_BASE_URL}/${ecr_repo_name}:latest

    # Push image
    docker push ${ECR_BASE_URL}/${ecr_repo_name}:latest

    echo -e "${GREEN}✓ ${service_name} pushed successfully${NC}\n"
}

# Push all images
echo -e "${BLUE}Step 2: Building and pushing images...${NC}\n"

# API Service (builds from repo root - needs domain/ folder)
if [ -d "${REPO_ROOT}/api_service" ]; then
    push_image "API Service" "api_service" "api_service" "false" ""
else
    echo -e "${YELLOW}⚠ API Service directory not found, skipping...${NC}\n"
fi

# Frontend (builds from frontend/ dir - needs package.json there)
if [ -d "${REPO_ROOT}/frontend" ]; then
    push_image "Frontend" "frontend" "frontend" "true" "--build-arg NEXT_PUBLIC_API_URL=${API_URL}"
else
    echo -e "${YELLOW}⚠ Frontend directory not found, skipping...${NC}\n"
fi

# SUV UI (builds from suv_ui/ dir - needs package.json there)
if [ -d "${REPO_ROOT}/suv_ui" ]; then
    push_image "SUV UI" "suv_ui" "suv_ui" "true" "--build-arg NEXT_PUBLIC_API_URL=${API_URL}"
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
