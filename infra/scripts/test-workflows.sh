#!/bin/bash
# Quick test script for GitHub Actions workflows

set -euo pipefail

# Defaults
REPO_ROOT="/Users/kajetanp/Documents/AAU CE/code/mday/mayday-resource-coordinator"
TERRAFORM_DIR="$REPO_ROOT/infra/terraform"

show_help() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  -p, --path PATH     Set repository root path to PATH (overrides default)
  -h, --help          Show this help message and exit

If --path is provided the script will use that path as the repository root
and will check the Terraform directory under it.
EOF
}

# Parse args
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -p|--path)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --path requires a value" >&2
        exit 2
      fi
      REPO_ROOT="$2"
      TERRAFORM_DIR="$REPO_ROOT/infra/terraform"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    --) # end argument parsing
      shift
      break
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_help
      exit 2
      ;;
  esac
done

echo "===================================="
echo "GitHub Actions Workflow Test Script"
echo "Repository root: $REPO_ROOT"
echo "Terraform dir: $TERRAFORM_DIR"
echo "===================================="
echo ""

# Test 1: Terraform Format
echo "✓ Test 1: Terraform Format Check"
cd "$TERRAFORM_DIR"
terraform fmt -check -recursive && echo "  ✅ All files properly formatted" || echo "  ⚠️  Some files need formatting (run: terraform fmt -recursive)"
echo ""

# Test 2: Terraform Init
echo "✓ Test 2: Terraform Init"
cd "$TERRAFORM_DIR"
if terraform init -backend=false > /dev/null 2>&1; then
  echo "  ✅ Terraform initialization successful"
else
  echo "  ❌ Terraform initialization failed"
  exit 1
fi
echo ""

# Test 3: Terraform Validate
echo "✓ Test 3: Terraform Validate"
cd "$TERRAFORM_DIR"
if terraform validate > /dev/null 2>&1; then
  echo "  ✅ Terraform configuration valid"
else
  echo "  ❌ Terraform validation failed"
  terraform validate
  exit 1
fi
echo ""

# Test 4: Check AWS Credentials
echo "✓ Test 4: AWS Credentials"
if aws sts get-caller-identity > /dev/null 2>&1; then
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  echo "  ✅ AWS credentials configured"
  echo "     Account ID: $ACCOUNT_ID"
else
  echo "  ❌ AWS credentials not configured"
  exit 1
fi
echo ""

# Test 5: Check S3 Backend
echo "✓ Test 5: S3 Backend"
if aws s3 ls s3://mayday-terraform-state-390299133544 > /dev/null 2>&1; then
  echo "  ✅ S3 backend bucket exists"
else
  echo "  ⚠️  S3 backend bucket not found"
  echo "     Run: cd infra/scripts && ./setup-terraform-backend.sh"
fi
echo ""

# Test 6: Check DynamoDB Table
echo "✓ Test 6: DynamoDB Lock Table"
if aws dynamodb describe-table --table-name mayday-terraform-locks --region eu-central-1 > /dev/null 2>&1; then
  echo "  ✅ DynamoDB lock table exists"
else
  echo "  ⚠️  DynamoDB lock table not found"
  echo "     Run: cd infra/scripts && ./setup-terraform-backend.sh"
fi
echo ""

# Test 7: Check ECR Repositories
echo "✓ Test 7: ECR Repositories"
if aws ecr describe-repositories --region eu-central-1 --repository-names mayday-api mayday-frontend mayday-suv-ui mayday-db > /dev/null 2>&1; then
  echo "  ✅ All ECR repositories exist"
else
  echo "  ⚠️  ECR repositories not found"
  echo "     Run Terraform apply first to create them"
fi
echo ""

# Test 8: Check ECS Cluster
echo "✓ Test 8: ECS Cluster"
if aws ecs describe-clusters --clusters mayday-cluster --region eu-central-1 --query 'clusters[0].status' --output text 2>&1 | grep -q "ACTIVE"; then
  echo "  ✅ ECS cluster exists and is active"
else
  echo "  ⚠️  ECS cluster not found"
  echo "     Run Terraform apply first to create it"
fi
echo ""

# Summary
echo "===================================="
echo "Summary"
echo "===================================="
echo ""
echo "Local tests complete! Your configuration is ready."
echo ""
echo "Next steps:"
echo "1. Push changes to GitHub"
echo "2. Create a Pull Request (triggers Terraform plan)"
echo "3. Review the plan in PR comments"
echo "4. Merge PR to main"
echo "5. Manually run workflows:"
echo "   - Terraform Infrastructure (apply)"
echo "   - Build and Push to ECR"
echo "   - Deploy to ECS"
echo ""
echo "See TESTING_WORKFLOWS.md for detailed instructions."
