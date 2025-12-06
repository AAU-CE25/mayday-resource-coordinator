#!/bin/bash

# Script to create or update IAM policies for GitHub Actions workflows
# Usage: ./setup-iam-policies.sh [--update]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICIES_DIR="$SCRIPT_DIR/../iam-policies"
POLICY_PREFIX="MDAY-"
UPDATE_MODE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
if [[ "$1" == "--update" ]]; then
    UPDATE_MODE=true
fi

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to get AWS account ID
get_account_id() {
    aws sts get-caller-identity --query Account --output text 2>/dev/null
}

# Function to check if policy exists
policy_exists() {
    local policy_name="$1"
    local account_id="$2"
    aws iam get-policy --policy-arn "arn:aws:iam::${account_id}:policy/${policy_name}" &>/dev/null
}

# Function to create policy
create_policy() {
    local policy_file="$1"
    local policy_name="$2"
    local description="$3"
    
    print_info "Creating policy: ${policy_name}"
    
    local policy_arn=$(aws iam create-policy \
        --policy-name "${policy_name}" \
        --policy-document "file://${policy_file}" \
        --description "${description}" \
        --query 'Policy.Arn' \
        --output text 2>&1)
    
    if [[ $? -eq 0 ]]; then
        print_success "Created policy: ${policy_name}"
        echo "           ARN: ${policy_arn}"
        return 0
    else
        print_error "Failed to create policy: ${policy_name}"
        echo "           Error: ${policy_arn}"
        return 1
    fi
}

# Function to update policy
update_policy() {
    local policy_file="$1"
    local policy_name="$2"
    local account_id="$3"
    local policy_arn="arn:aws:iam::${account_id}:policy/${policy_name}"
    
    print_info "Updating policy: ${policy_name}"
    
    # Delete old non-default versions first (AWS allows max 5 versions)
    local versions=$(aws iam list-policy-versions \
        --policy-arn "${policy_arn}" \
        --query 'Versions[?IsDefaultVersion==`false`].VersionId' \
        --output text)
    
    for version in $versions; do
        aws iam delete-policy-version \
            --policy-arn "${policy_arn}" \
            --version-id "${version}" &>/dev/null
    done
    
    # Create new version and set as default
    local new_version=$(aws iam create-policy-version \
        --policy-arn "${policy_arn}" \
        --policy-document "file://${policy_file}" \
        --set-as-default \
        --query 'PolicyVersion.VersionId' \
        --output text 2>&1)
    
    if [[ $? -eq 0 ]]; then
        print_success "Updated policy: ${policy_name} (version: ${new_version})"
        return 0
    else
        print_error "Failed to update policy: ${policy_name}"
        echo "           Error: ${new_version}"
        return 1
    fi
}

# Function to validate JSON
validate_json() {
    local file="$1"
    if jq empty "$file" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    echo ""
    print_info "GitHub Actions IAM Policy Setup"
    echo "=================================="
    echo ""
    
    # Check for required tools
    print_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq not found. Please install it first."
        exit 1
    fi
    
    print_success "Required tools found"
    echo ""
    
    # Get AWS account ID
    print_info "Getting AWS account information..."
    ACCOUNT_ID=$(get_account_id)
    
    if [[ -z "$ACCOUNT_ID" ]]; then
        print_error "Failed to get AWS account ID. Check your AWS credentials."
        exit 1
    fi
    
    print_success "AWS Account ID: ${ACCOUNT_ID}"
    echo ""
    
    # Define policies to create/update
    declare -a POLICY_FILES=(
        "github-terraform-networking-policy.json"
        "github-terraform-services-policy.json"
        "github-ecr-push-policy.json"
        "github-ecs-deploy-policy.json"
    )
    
    declare -a POLICY_DESCRIPTIONS=(
        "GitHub Actions Terraform workflow - manages VPC, subnets, NAT, ALB networking"
        "GitHub Actions Terraform workflow - manages ECS, ECR, IAM, autoscaling services"
        "GitHub Actions ECR workflow - builds and pushes Docker images"
        "GitHub Actions ECS workflow - deploys services to ECS Fargate"
    )
    
    # Process each policy
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    SKIP_COUNT=0
    
    for i in "${!POLICY_FILES[@]}"; do
        policy_file="${POLICY_FILES[$i]}"
        policy_path="${POLICIES_DIR}/${policy_file}"
        policy_name="${POLICY_PREFIX}${policy_file%.json}"
        description="${POLICY_DESCRIPTIONS[$i]}"
        
        # Check if file exists
        if [[ ! -f "$policy_path" ]]; then
            print_warning "Policy file not found: ${policy_file}"
            SKIP_COUNT=$((SKIP_COUNT + 1))
            continue
        fi
        
        # Validate JSON
        print_info "Validating ${policy_file}..."
        if ! validate_json "$policy_path"; then
            print_error "Invalid JSON in ${policy_file}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            continue
        fi
        print_success "Valid JSON"
        
        # Check if policy exists
        if policy_exists "${policy_name}" "${ACCOUNT_ID}"; then
            if [[ "$UPDATE_MODE" == true ]]; then
                if update_policy "$policy_path" "$policy_name" "$ACCOUNT_ID"; then
                    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                else
                    FAIL_COUNT=$((FAIL_COUNT + 1))
                fi
            else
                print_warning "Policy ${policy_name} already exists. Use --update to update it."
                SKIP_COUNT=$((SKIP_COUNT + 1))
            fi
        else
            if create_policy "$policy_path" "$policy_name" "$description"; then
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                FAIL_COUNT=$((FAIL_COUNT + 1))
            fi
        fi
        
        echo ""
    done
    
    # Summary
    echo "=================================="
    echo "Summary:"
    echo ""
    print_success "Successful: ${SUCCESS_COUNT}"
    
    if [[ $SKIP_COUNT -gt 0 ]]; then
        print_warning "Skipped: ${SKIP_COUNT}"
    fi
    
    if [[ $FAIL_COUNT -gt 0 ]]; then
        print_error "Failed: ${FAIL_COUNT}"
    fi
    
    echo ""
    
    # Next steps
    if [[ $SUCCESS_COUNT -gt 0 ]]; then
        echo "Finished setting up IAM policies."
    fi
    
    if [[ $FAIL_COUNT -gt 0 ]]; then
        exit 1
    fi
}

# Run main function
main
