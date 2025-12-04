#!/bin/bash
# Setup script for ECR infrastructure
# This should be run ONCE before deploying the application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECR_DIR="${SCRIPT_DIR}/../terraform-ecr"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setting up ECR Infrastructure ===${NC}\n"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${GREEN}✓ AWS credentials validated${NC}\n"

# Initialize and apply ECR terraform
echo -e "${YELLOW}Initializing ECR Terraform...${NC}"
cd "${ECR_DIR}"

terraform init

echo -e "\n${YELLOW}Planning ECR infrastructure...${NC}"
terraform plan

echo -e "\n${YELLOW}Apply ECR infrastructure? (yes/no)${NC}"
read -r response

if [[ "$response" == "yes" ]]; then
    terraform apply
    echo -e "\n${GREEN}=== ECR Infrastructure Setup Complete! ===${NC}"
    echo -e "\nECR Repository URLs:"
    terraform output
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Build and push your container images"
    echo "2. Deploy the application infrastructure in ../terraform/"
else
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 0
fi
