#!/bin/bash

set -e  # Exit on error

# Default configuration
AWS_REGION="eu-central-1"
CLUSTER_NAME="mayday-cluster"

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

# Check if cluster name argument provided
if [ "$#" -ge 1 ]; then
    CLUSTER_NAME=$1
fi

echo ""
echo "=========================================="
echo "       AWS ECS Teardown Script"
echo "=========================================="
info "Region: ${AWS_REGION}"
info "Cluster Name: ${CLUSTER_NAME}"
echo "=========================================="
echo ""

# Confirmation prompt
warning "This will DELETE all resources associated with cluster: ${CLUSTER_NAME}"
warning "This action cannot be undone!"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    info "Teardown cancelled."
    exit 0
fi

echo ""
info "Starting teardown..."
echo ""

# ========================================
# Step 1: Delete ECS Services
# ========================================
info "Deleting ECS Services..."

SERVICES=$(aws ecs list-services \
    --cluster ${CLUSTER_NAME} \
    --query "serviceArns[]" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null) || true

if [ -n "$SERVICES" ] && [ "$SERVICES" != "None" ]; then
    for SERVICE_ARN in $SERVICES; do
        SERVICE_NAME=$(echo $SERVICE_ARN | awk -F'/' '{print $NF}')
        info "Stopping service: ${SERVICE_NAME}"
        
        # Update service to 0 desired count
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service ${SERVICE_NAME} \
            --desired-count 0 \
            --region ${AWS_REGION} > /dev/null 2>&1 || true
        
        # Delete the service
        aws ecs delete-service \
            --cluster ${CLUSTER_NAME} \
            --service ${SERVICE_NAME} \
            --force \
            --region ${AWS_REGION} > /dev/null 2>&1 || true
        
        success "Deleted service: ${SERVICE_NAME}"
    done
else
    info "No ECS services found"
fi

# Wait for services to be deleted
info "Waiting for services to be fully deleted..."
sleep 10

# ========================================
# Step 2: Delete Service Discovery Services
# ========================================
info "Deleting Service Discovery Services..."

NAMESPACE_ID=$(aws servicediscovery list-namespaces \
    --query "Namespaces[?Name=='${CLUSTER_NAME}.local'].Id" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null) || true

if [ -n "$NAMESPACE_ID" ] && [ "$NAMESPACE_ID" != "None" ]; then
    # Get all services in the namespace
    SD_SERVICES=$(aws servicediscovery list-services \
        --filters Name=NAMESPACE_ID,Values=${NAMESPACE_ID} \
        --query "Services[].Id" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null) || true
    
    if [ -n "$SD_SERVICES" ] && [ "$SD_SERVICES" != "None" ]; then
        for SD_SERVICE_ID in $SD_SERVICES; do
            SD_SERVICE_NAME=$(aws servicediscovery get-service \
                --id ${SD_SERVICE_ID} \
                --query "Service.Name" \
                --output text \
                --region ${AWS_REGION} 2>/dev/null) || true
            
            # Deregister all instances first
            INSTANCES=$(aws servicediscovery list-instances \
                --service-id ${SD_SERVICE_ID} \
                --query "Instances[].Id" \
                --output text \
                --region ${AWS_REGION} 2>/dev/null) || true
            
            if [ -n "$INSTANCES" ] && [ "$INSTANCES" != "None" ]; then
                for INSTANCE_ID in $INSTANCES; do
                    aws servicediscovery deregister-instance \
                        --service-id ${SD_SERVICE_ID} \
                        --instance-id ${INSTANCE_ID} \
                        --region ${AWS_REGION} > /dev/null 2>&1 || true
                done
            fi
            
            # Delete the service discovery service
            aws servicediscovery delete-service \
                --id ${SD_SERVICE_ID} \
                --region ${AWS_REGION} > /dev/null 2>&1 || true
            
            success "Deleted Service Discovery service: ${SD_SERVICE_NAME}"
        done
    fi
    
    # Wait a bit for instances to deregister
    sleep 5
    
    # Delete the namespace
    info "Deleting Service Discovery Namespace..."
    aws servicediscovery delete-namespace \
        --id ${NAMESPACE_ID} \
        --region ${AWS_REGION} > /dev/null 2>&1 || true
    success "Deleted Service Discovery Namespace: ${NAMESPACE_ID}"
else
    info "No Service Discovery namespace found"
fi

# ========================================
# Step 3: Deregister Task Definitions
# ========================================
info "Deregistering Task Definitions..."

for FAMILY in "${CLUSTER_NAME}-db" "${CLUSTER_NAME}-api" "${CLUSTER_NAME}-frontend" "${CLUSTER_NAME}-suv-ui"; do
    TASK_DEFS=$(aws ecs list-task-definitions \
        --family-prefix ${FAMILY} \
        --query "taskDefinitionArns[]" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null) || true
    
    if [ -n "$TASK_DEFS" ] && [ "$TASK_DEFS" != "None" ]; then
        for TASK_DEF in $TASK_DEFS; do
            aws ecs deregister-task-definition \
                --task-definition ${TASK_DEF} \
                --region ${AWS_REGION} > /dev/null 2>&1 || true
        done
        success "Deregistered task definitions for: ${FAMILY}"
    fi
done

# ========================================
# Step 4: Delete ECS Cluster
# ========================================
info "Deleting ECS Cluster..."

aws ecs delete-cluster \
    --cluster ${CLUSTER_NAME} \
    --region ${AWS_REGION} > /dev/null 2>&1 || true
success "Deleted ECS Cluster: ${CLUSTER_NAME}"

# ========================================
# Step 5: Delete CloudWatch Log Groups
# ========================================
info "Deleting CloudWatch Log Groups..."

for service in "db" "api_service" "frontend" "suv_ui"; do
    LOG_GROUP="/ecs/${CLUSTER_NAME}/${service}"
    aws logs delete-log-group \
        --log-group-name ${LOG_GROUP} \
        --region ${AWS_REGION} 2>/dev/null || true
    success "Deleted Log Group: ${LOG_GROUP}"
done

# ========================================
# Step 6: Delete IAM Role
# ========================================
info "Deleting IAM Roles..."

EXECUTION_ROLE_NAME="${CLUSTER_NAME}-task-execution-role"

# Check if role exists
if aws iam get-role --role-name ${EXECUTION_ROLE_NAME} > /dev/null 2>&1; then
    # Detach policies first
    ATTACHED_POLICIES=$(aws iam list-attached-role-policies \
        --role-name ${EXECUTION_ROLE_NAME} \
        --query "AttachedPolicies[].PolicyArn" \
        --output text 2>/dev/null) || true
    
    if [ -n "$ATTACHED_POLICIES" ] && [ "$ATTACHED_POLICIES" != "None" ]; then
        for POLICY_ARN in $ATTACHED_POLICIES; do
            aws iam detach-role-policy \
                --role-name ${EXECUTION_ROLE_NAME} \
                --policy-arn ${POLICY_ARN} 2>/dev/null || true
        done
    fi
    
    # Delete the role
    aws iam delete-role \
        --role-name ${EXECUTION_ROLE_NAME} 2>/dev/null || true
    success "Deleted IAM Role: ${EXECUTION_ROLE_NAME}"
else
    info "IAM Role not found: ${EXECUTION_ROLE_NAME}"
fi

# ========================================
# Step 7: Delete VPC and Networking Resources
# ========================================
info "Deleting VPC and Networking Resources..."

# Find VPC
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=${CLUSTER_NAME}-vpc" \
    --query "Vpcs[0].VpcId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null) || true

if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
    
    # Delete Security Group
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=group-name,Values=${CLUSTER_NAME}-sg" \
        --query "SecurityGroups[0].GroupId" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null) || true
    
    if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
        aws ec2 delete-security-group \
            --group-id ${SG_ID} \
            --region ${AWS_REGION} 2>/dev/null || true
        success "Deleted Security Group: ${SG_ID}"
    fi
    
    # Delete Subnets
    SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" \
        --query "Subnets[].SubnetId" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null) || true
    
    if [ -n "$SUBNET_IDS" ] && [ "$SUBNET_IDS" != "None" ]; then
        for SUBNET_ID in $SUBNET_IDS; do
            aws ec2 delete-subnet \
                --subnet-id ${SUBNET_ID} \
                --region ${AWS_REGION} 2>/dev/null || true
            success "Deleted Subnet: ${SUBNET_ID}"
        done
    fi
    
    # Delete Route Table (non-main)
    RT_IDS=$(aws ec2 describe-route-tables \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${CLUSTER_NAME}-rt" \
        --query "RouteTables[].RouteTableId" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null) || true
    
    if [ -n "$RT_IDS" ] && [ "$RT_IDS" != "None" ]; then
        for RT_ID in $RT_IDS; do
            # Disassociate route table associations first
            ASSOC_IDS=$(aws ec2 describe-route-tables \
                --route-table-ids ${RT_ID} \
                --query "RouteTables[0].Associations[?!Main].RouteTableAssociationId" \
                --output text \
                --region ${AWS_REGION} 2>/dev/null) || true
            
            if [ -n "$ASSOC_IDS" ] && [ "$ASSOC_IDS" != "None" ]; then
                for ASSOC_ID in $ASSOC_IDS; do
                    aws ec2 disassociate-route-table \
                        --association-id ${ASSOC_ID} \
                        --region ${AWS_REGION} 2>/dev/null || true
                done
            fi
            
            aws ec2 delete-route-table \
                --route-table-id ${RT_ID} \
                --region ${AWS_REGION} 2>/dev/null || true
            success "Deleted Route Table: ${RT_ID}"
        done
    fi
    
    # Detach and Delete Internet Gateway
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --filters "Name=attachment.vpc-id,Values=${VPC_ID}" \
        --query "InternetGateways[0].InternetGatewayId" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null) || true
    
    if [ -n "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
        aws ec2 detach-internet-gateway \
            --internet-gateway-id ${IGW_ID} \
            --vpc-id ${VPC_ID} \
            --region ${AWS_REGION} 2>/dev/null || true
        
        aws ec2 delete-internet-gateway \
            --internet-gateway-id ${IGW_ID} \
            --region ${AWS_REGION} 2>/dev/null || true
        success "Deleted Internet Gateway: ${IGW_ID}"
    fi
    
    # Delete VPC
    aws ec2 delete-vpc \
        --vpc-id ${VPC_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    success "Deleted VPC: ${VPC_ID}"
else
    info "VPC not found: ${CLUSTER_NAME}-vpc"
fi

# ========================================
# Summary
# ========================================
echo ""
echo "=========================================="
echo "           TEARDOWN SUMMARY"
echo "=========================================="
echo ""
success "Teardown Complete!"
echo ""
info "The following resources have been deleted:"
echo "  • ECS Services"
echo "  • Service Discovery Namespace and Services"
echo "  • Task Definitions"
echo "  • ECS Cluster: ${CLUSTER_NAME}"
echo "  • CloudWatch Log Groups"
echo "  • IAM Role: ${CLUSTER_NAME}-task-execution-role"
echo "  • VPC and all networking resources"
echo ""
warning "Note: ECR repositories and images were NOT deleted."
warning "To delete ECR repos, run:"
echo "  aws ecr delete-repository --repository-name api_service --force --region ${AWS_REGION}"
echo "  aws ecr delete-repository --repository-name frontend --force --region ${AWS_REGION}"
echo "  aws ecr delete-repository --repository-name suv_ui --force --region ${AWS_REGION}"
echo ""
success "Teardown script completed!"
