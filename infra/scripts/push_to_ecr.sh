#!/bin/bash



set -e  # Exit on error

# Default to EU Central 1
AWS_REGION="eu-central-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions for colored output
error() {
    echo -e "${RED}❌ ERROR: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required arguments are provided
if [ "$#" -ne 1 ]; then
    error "Missing AWS Account ID"
    echo ""
    echo "Usage: $0 <aws-account-id>"
    echo "Example: $0 123456789012"
    echo ""
    info "To find your AWS Account ID, run: aws sts get-caller-identity --query Account --output text"
    exit 1
fi

AWS_ACCOUNT_ID=$1
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo ""
echo "=========================================="
echo "       AWS ECR Push Script"
echo "=========================================="
info "Region: ${AWS_REGION}"
info "Account ID: ${AWS_ACCOUNT_ID}"
info "Registry: ${ECR_REGISTRY}"
echo "=========================================="
echo ""

# Pre-flight checks
info "Running pre-flight checks..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed"
    echo ""
    echo "To install AWS CLI on macOS:"
    echo "  brew install awscli"
    echo ""
    echo "For other platforms, visit: https://aws.amazon.com/cli/"
    exit 1
fi
success "AWS CLI is installed"

# Check if Docker is running
if ! docker info &> /dev/null; then
    error "Docker is not running"
    echo ""
    echo "Please start Docker Desktop and try again"
    exit 1
fi
success "Docker is running"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    error "AWS credentials are not configured or invalid"
    echo ""
    echo "To configure AWS credentials:"
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: eu-central-1"
    echo ""
    echo "Or set environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your-key"
    echo "  export AWS_SECRET_ACCESS_KEY=your-secret"
    exit 1
fi
success "AWS credentials are valid"

# Verify the AWS account ID matches
CURRENT_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ "$CURRENT_ACCOUNT_ID" != "$AWS_ACCOUNT_ID" ]; then
    warning "Current AWS account ($CURRENT_ACCOUNT_ID) doesn't match provided account ID ($AWS_ACCOUNT_ID)"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Aborted by user"
        exit 1
    fi
fi

# Check if docker-compose.yml exists
if [ ! -f "compose.yaml" ]; then
    error "compose.yaml not found in current directory"
    echo ""
    echo "Please run this script from the project root directory:"
    echo "  cd /path/to/mayday-resource-coordinator"
    echo "  ./push_to_ecr.sh ${AWS_ACCOUNT_ID}"
    exit 1
fi
success "Found compose.yaml"

echo ""
info "All pre-flight checks passed!"
echo ""

# Authenticate Docker to ECR
info "Authenticating Docker to AWS ECR..."
if aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY} 2>/dev/null; then
    success "Successfully authenticated to ECR"
else
    error "Failed to authenticate to ECR"
    echo ""
    echo "Possible causes:"
    echo "  1. Invalid AWS credentials"
    echo "  2. No permission to access ECR"
    echo "  3. Wrong region (currently using: ${AWS_REGION})"
    echo ""
    echo "Required IAM permissions:"
    echo "  - ecr:GetAuthorizationToken"
    echo "  - ecr:BatchCheckLayerAvailability"
    echo "  - ecr:PutImage"
    echo "  - ecr:InitiateLayerUpload"
    echo "  - ecr:UploadLayerPart"
    echo "  - ecr:CompleteLayerUpload"
    exit 1
fi

# Define services to push
declare -a services=("api_service" "frontend" "suv_ui")

# Function to create ECR repository if it doesn't exist
create_repo_if_not_exists() {
    local repo_name=$1
    info "Checking if repository '${repo_name}' exists..."
    
    if aws ecr describe-repositories --repository-names ${repo_name} --region ${AWS_REGION} 2>&1 | grep -q "RepositoryNotFoundException"; then
        info "Creating ECR repository: ${repo_name}"
        if aws ecr create-repository \
            --repository-name ${repo_name} \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 &>/dev/null; then
            success "Created repository: ${repo_name}"
        else
            error "Failed to create repository: ${repo_name}"
            echo ""
            echo "Possible causes:"
            echo "  - No permission to create ECR repositories"
            echo "  - Repository name conflicts with existing one"
            echo ""
            echo "Required IAM permission:"
            echo "  - ecr:CreateRepository"
            return 1
        fi
    else
        success "Repository '${repo_name}' already exists"
    fi
}

# Function to build, tag and push an image
push_image() {
    local service_name=$1
    local local_image="${service_name}:latest"
    local remote_image="${ECR_REGISTRY}/${service_name}:latest"
    
    echo ""
    echo "=========================================="
    info "Processing: ${service_name}"
    echo "=========================================="
    
    # Create repository if needed
    if ! create_repo_if_not_exists ${service_name}; then
        error "Skipping ${service_name} due to repository creation failure"
        return 1
    fi
    
    # Check if local image exists
    if docker image inspect ${local_image} >/dev/null 2>&1; then
        success "Found local image: ${local_image}"
        
        info "Tagging image: ${local_image} -> ${remote_image}"
        if ! docker tag ${local_image} ${remote_image}; then
            error "Failed to tag image ${service_name}"
            return 1
        fi
        
        info "Pushing image to ECR: ${remote_image}"
        echo "This may take a few minutes..."
        if docker push ${remote_image}; then
            success "Successfully pushed ${service_name}"
        else
            error "Failed to push ${service_name}"
            echo ""
            echo "Possible causes:"
            echo "  - Network connectivity issues"
            echo "  - No permission to push to ECR"
            echo "  - Image size too large"
            return 1
        fi
    else
        warning "Local image ${local_image} not found. Building it first..."
        info "Building ${service_name}..."
        
        if ! docker compose build ${service_name}; then
            error "Failed to build ${service_name}"
            echo ""
            echo "Possible causes:"
            echo "  - Missing Dockerfile"
            echo "  - Build context errors"
            echo "  - Missing dependencies in requirements.txt"
            echo ""
            echo "Check the build output above for specific errors"
            return 1
        fi
        
        success "Build completed for ${service_name}"
        
        info "Tagging image: ${local_image} -> ${remote_image}"
        if ! docker tag ${local_image} ${remote_image}; then
            error "Failed to tag image ${service_name}"
            return 1
        fi
        
        info "Pushing image to ECR: ${remote_image}"
        echo "This may take a few minutes..."
        if docker push ${remote_image}; then
            success "Successfully built and pushed ${service_name}"
        else
            error "Failed to push ${service_name}"
            return 1
        fi
    fi
    
    return 0
}

# Process each service
echo ""
info "Starting to push ${#services[@]} services..."
echo ""

failed_services=()
successful_services=()

for service in "${services[@]}"; do
    if push_image ${service}; then
        successful_services+=("${service}")
    else
        failed_services+=("${service}")
    fi
done

echo ""
echo "=========================================="
echo "           SUMMARY"
echo "=========================================="

if [ ${#successful_services[@]} -gt 0 ]; then
    echo ""
    success "Successfully pushed ${#successful_services[@]} service(s):"
    for service in "${successful_services[@]}"; do
        echo "  ✓ ${service}"
    done
fi

if [ ${#failed_services[@]} -gt 0 ]; then
    echo ""
    error "Failed to push ${#failed_services[@]} service(s):"
    for service in "${failed_services[@]}"; do
        echo "  ✗ ${service}"
    done
    echo ""
    echo "=========================================="
    exit 1
fi

echo ""
echo "=========================================="
success "All images pushed successfully!"
echo "=========================================="
echo ""
info "Your images are now available at:"
for service in "${services[@]}"; do
    echo "  - ${ECR_REGISTRY}/${service}:latest"
done
echo ""
info "To pull an image on another machine:"
echo ""
echo "  1. Authenticate:"
echo "     aws ecr get-login-password --region ${AWS_REGION} | \\"
echo "       docker login --username AWS --password-stdin ${ECR_REGISTRY}"
echo ""
echo "  2. Pull an image:"
echo "     docker pull ${ECR_REGISTRY}/<service-name>:latest"
echo ""
info "To use in production, update your compose.yaml or deployment config:"
echo ""
echo "  services:"
echo "    api_service:"
echo "      image: ${ECR_REGISTRY}/api_service:latest"
echo ""
success "Script completed successfully!"
echo ""
