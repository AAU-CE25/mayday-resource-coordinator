#!/bin/bash

set -e  # Exit on error

# Default configuration
AWS_REGION="eu-central-1"
CLUSTER_NAME="mayday-cluster"
VPC_CIDR="10.0.0.0/16"

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
if [ "$#" -lt 1 ]; then
    error "Missing AWS Account ID"
    echo ""
    echo "Usage: $0 <aws-account-id> [cluster-name]"
    echo "Example: $0 123456789012"
    echo "Example: $0 123456789012 my-custom-cluster"
    echo ""
    info "To find your AWS Account ID, run: aws sts get-caller-identity --query Account --output text"
    exit 1
fi

AWS_ACCOUNT_ID=$1
if [ "$#" -ge 2 ]; then
    CLUSTER_NAME=$2
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo ""
echo "=========================================="
echo "       AWS ECS Deployment Script"
echo "=========================================="
info "Region: ${AWS_REGION}"
info "Account ID: ${AWS_ACCOUNT_ID}"
info "Cluster Name: ${CLUSTER_NAME}"
info "ECR Registry: ${ECR_REGISTRY}"
echo "=========================================="
echo ""

# Pre-flight checks
info "Running pre-flight checks..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed"
    exit 1
fi
success "AWS CLI is installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    error "AWS credentials are not configured or invalid"
    exit 1
fi
success "AWS credentials are valid"

echo ""
info "All pre-flight checks passed!"
echo ""

# ========================================
# Step 1: Create or get VPC and Subnets
# ========================================
info "Setting up VPC and networking..."

# Check if VPC exists with the tag
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=${CLUSTER_NAME}-vpc" \
    --query "Vpcs[0].VpcId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    info "Creating new VPC..."
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block ${VPC_CIDR} \
        --query 'Vpc.VpcId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 create-tags \
        --resources ${VPC_ID} \
        --tags Key=Name,Value=${CLUSTER_NAME}-vpc \
        --region ${AWS_REGION}
    
    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute \
        --vpc-id ${VPC_ID} \
        --enable-dns-hostnames \
        --region ${AWS_REGION}
    
    success "Created VPC: ${VPC_ID}"
else
    success "Using existing VPC: ${VPC_ID}"
fi

# Create Internet Gateway if not exists
IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=${VPC_ID}" \
    --query "InternetGateways[0].InternetGatewayId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$IGW_ID" == "None" ] || [ -z "$IGW_ID" ]; then
    info "Creating Internet Gateway..."
    IGW_ID=$(aws ec2 create-internet-gateway \
        --query 'InternetGateway.InternetGatewayId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 attach-internet-gateway \
        --internet-gateway-id ${IGW_ID} \
        --vpc-id ${VPC_ID} \
        --region ${AWS_REGION}
    
    success "Created and attached Internet Gateway: ${IGW_ID}"
else
    success "Using existing Internet Gateway: ${IGW_ID}"
fi

# Get availability zones
AZS=$(aws ec2 describe-availability-zones \
    --query "AvailabilityZones[0:2].ZoneName" \
    --output text \
    --region ${AWS_REGION})
AZ1=$(echo $AZS | awk '{print $1}')
AZ2=$(echo $AZS | awk '{print $2}')

# Create subnets
SUBNET1_ID=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${CLUSTER_NAME}-subnet-1" \
    --query "Subnets[0].SubnetId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$SUBNET1_ID" == "None" ] || [ -z "$SUBNET1_ID" ]; then
    info "Creating Subnet 1..."
    SUBNET1_ID=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block "10.0.1.0/24" \
        --availability-zone ${AZ1} \
        --query 'Subnet.SubnetId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 create-tags \
        --resources ${SUBNET1_ID} \
        --tags Key=Name,Value=${CLUSTER_NAME}-subnet-1 \
        --region ${AWS_REGION}
    
    # Enable auto-assign public IP
    aws ec2 modify-subnet-attribute \
        --subnet-id ${SUBNET1_ID} \
        --map-public-ip-on-launch \
        --region ${AWS_REGION}
    
    success "Created Subnet 1: ${SUBNET1_ID}"
else
    success "Using existing Subnet 1: ${SUBNET1_ID}"
fi

SUBNET2_ID=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${CLUSTER_NAME}-subnet-2" \
    --query "Subnets[0].SubnetId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$SUBNET2_ID" == "None" ] || [ -z "$SUBNET2_ID" ]; then
    info "Creating Subnet 2..."
    SUBNET2_ID=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block "10.0.2.0/24" \
        --availability-zone ${AZ2} \
        --query 'Subnet.SubnetId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 create-tags \
        --resources ${SUBNET2_ID} \
        --tags Key=Name,Value=${CLUSTER_NAME}-subnet-2 \
        --region ${AWS_REGION}
    
    aws ec2 modify-subnet-attribute \
        --subnet-id ${SUBNET2_ID} \
        --map-public-ip-on-launch \
        --region ${AWS_REGION}
    
    success "Created Subnet 2: ${SUBNET2_ID}"
else
    success "Using existing Subnet 2: ${SUBNET2_ID}"
fi

# Create/update route table
RT_ID=$(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${CLUSTER_NAME}-rt" \
    --query "RouteTables[0].RouteTableId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$RT_ID" == "None" ] || [ -z "$RT_ID" ]; then
    info "Creating Route Table..."
    RT_ID=$(aws ec2 create-route-table \
        --vpc-id ${VPC_ID} \
        --query 'RouteTable.RouteTableId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 create-tags \
        --resources ${RT_ID} \
        --tags Key=Name,Value=${CLUSTER_NAME}-rt \
        --region ${AWS_REGION}
    
    # Add route to internet gateway
    aws ec2 create-route \
        --route-table-id ${RT_ID} \
        --destination-cidr-block "0.0.0.0/0" \
        --gateway-id ${IGW_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Associate subnets with route table
    aws ec2 associate-route-table \
        --route-table-id ${RT_ID} \
        --subnet-id ${SUBNET1_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    aws ec2 associate-route-table \
        --route-table-id ${RT_ID} \
        --subnet-id ${SUBNET2_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    success "Created Route Table: ${RT_ID}"
else
    success "Using existing Route Table: ${RT_ID}"
fi

# ========================================
# Step 2: Create Security Group
# ========================================
info "Setting up Security Group..."

SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=group-name,Values=${CLUSTER_NAME}-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    info "Creating Security Group..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name ${CLUSTER_NAME}-sg \
        --description "Security group for ${CLUSTER_NAME} ECS services" \
        --vpc-id ${VPC_ID} \
        --query 'GroupId' \
        --output text \
        --region ${AWS_REGION})
    
    # Add inbound rules
    # API Service (8000)
    aws ec2 authorize-security-group-ingress \
        --group-id ${SG_ID} \
        --protocol tcp \
        --port 8000 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Frontend (3000)
    aws ec2 authorize-security-group-ingress \
        --group-id ${SG_ID} \
        --protocol tcp \
        --port 3000 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # SUV UI (3030)
    aws ec2 authorize-security-group-ingress \
        --group-id ${SG_ID} \
        --protocol tcp \
        --port 3030 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # PostgreSQL (5432) - internal only
    aws ec2 authorize-security-group-ingress \
        --group-id ${SG_ID} \
        --protocol tcp \
        --port 5432 \
        --source-group ${SG_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Allow all outbound
    aws ec2 authorize-security-group-egress \
        --group-id ${SG_ID} \
        --protocol -1 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    success "Created Security Group: ${SG_ID}"
else
    success "Using existing Security Group: ${SG_ID}"
fi

# ========================================
# Step 3: Create ECS Cluster
# ========================================
info "Setting up ECS Cluster..."

CLUSTER_ARN=$(aws ecs describe-clusters \
    --clusters ${CLUSTER_NAME} \
    --query "clusters[?status=='ACTIVE'].clusterArn" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ -z "$CLUSTER_ARN" ]; then
    info "Creating ECS Cluster..."
    CLUSTER_ARN=$(aws ecs create-cluster \
        --cluster-name ${CLUSTER_NAME} \
        --query 'cluster.clusterArn' \
        --output text \
        --region ${AWS_REGION})
    success "Created ECS Cluster: ${CLUSTER_ARN}"
else
    success "Using existing ECS Cluster: ${CLUSTER_ARN}"
fi

# ========================================
# Step 4: Create IAM Roles
# ========================================
info "Setting up IAM Roles..."

# ECS Task Execution Role
EXECUTION_ROLE_NAME="${CLUSTER_NAME}-task-execution-role"
EXECUTION_ROLE_ARN=$(aws iam get-role \
    --role-name ${EXECUTION_ROLE_NAME} \
    --query 'Role.Arn' \
    --output text 2>/dev/null) || true

if [ -z "$EXECUTION_ROLE_ARN" ]; then
    info "Creating ECS Task Execution Role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
    
    EXECUTION_ROLE_ARN=$(aws iam create-role \
        --role-name ${EXECUTION_ROLE_NAME} \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --query 'Role.Arn' \
        --output text)
    
    # Attach required policies
    aws iam attach-role-policy \
        --role-name ${EXECUTION_ROLE_NAME} \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    rm /tmp/trust-policy.json
    success "Created ECS Task Execution Role: ${EXECUTION_ROLE_ARN}"
else
    success "Using existing ECS Task Execution Role: ${EXECUTION_ROLE_ARN}"
fi

# ========================================
# Step 5: Create CloudWatch Log Groups
# ========================================
info "Setting up CloudWatch Log Groups..."

for service in "db" "api_service" "frontend" "suv_ui"; do
    LOG_GROUP="/ecs/${CLUSTER_NAME}/${service}"
    if ! aws logs describe-log-groups --log-group-name-prefix ${LOG_GROUP} --query "logGroups[?logGroupName=='${LOG_GROUP}']" --output text --region ${AWS_REGION} | grep -q ${LOG_GROUP}; then
        aws logs create-log-group --log-group-name ${LOG_GROUP} --region ${AWS_REGION}
        success "Created Log Group: ${LOG_GROUP}"
    else
        success "Log Group exists: ${LOG_GROUP}"
    fi
done

# ========================================
# Step 6: Register Task Definitions
# ========================================
info "Registering Task Definitions..."

# Database Task Definition
cat > /tmp/db-task-def.json << EOF
{
    "family": "${CLUSTER_NAME}-db",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "${EXECUTION_ROLE_ARN}",
    "containerDefinitions": [
        {
            "name": "db",
            "image": "postgres:18",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 5432,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "POSTGRES_USER", "value": "postgres"},
                {"name": "POSTGRES_PASSWORD", "value": "postgres"},
                {"name": "POSTGRES_DB", "value": "mayday"},
                {"name": "PGDATA", "value": "/var/lib/postgresql/data/pgdata"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${CLUSTER_NAME}/db",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "pg_isready -U postgres -d mayday"],
                "interval": 10,
                "timeout": 5,
                "retries": 5,
                "startPeriod": 30
            }
        }
    ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/db-task-def.json \
    --region ${AWS_REGION} > /dev/null
success "Registered Task Definition: ${CLUSTER_NAME}-db"

# API Service Task Definition
cat > /tmp/api-task-def.json << EOF
{
    "family": "${CLUSTER_NAME}-api",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "${EXECUTION_ROLE_ARN}",
    "containerDefinitions": [
        {
            "name": "api_service",
            "image": "${ECR_REGISTRY}/api_service:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "POSTGRES_HOST", "value": "db.${CLUSTER_NAME}.local"},
                {"name": "POSTGRES_USER", "value": "postgres"},
                {"name": "POSTGRES_PASSWORD", "value": "postgres"},
                {"name": "POSTGRES_DB", "value": "mayday"},
                {"name": "POSTGRES_PORT", "value": "5432"},
                {"name": "CORS_ALLOW_ALL", "value": "true"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${CLUSTER_NAME}/api_service",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/api-task-def.json \
    --region ${AWS_REGION} > /dev/null
success "Registered Task Definition: ${CLUSTER_NAME}-api"

# Frontend Task Definition
cat > /tmp/frontend-task-def.json << EOF
{
    "family": "${CLUSTER_NAME}-frontend",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "${EXECUTION_ROLE_ARN}",
    "containerDefinitions": [
        {
            "name": "frontend",
            "image": "${ECR_REGISTRY}/frontend:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 3000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "NEXT_PUBLIC_API_URL", "value": "http://api.${CLUSTER_NAME}.local:8000"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${CLUSTER_NAME}/frontend",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/frontend-task-def.json \
    --region ${AWS_REGION} > /dev/null
success "Registered Task Definition: ${CLUSTER_NAME}-frontend"

# SUV UI Task Definition
cat > /tmp/suv-ui-task-def.json << EOF
{
    "family": "${CLUSTER_NAME}-suv-ui",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "${EXECUTION_ROLE_ARN}",
    "containerDefinitions": [
        {
            "name": "suv_ui",
            "image": "${ECR_REGISTRY}/suv_ui:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 3030,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "PORT", "value": "3030"},
                {"name": "NEXT_PUBLIC_API_URL", "value": "http://api.${CLUSTER_NAME}.local:8000"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${CLUSTER_NAME}/suv_ui",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/suv-ui-task-def.json \
    --region ${AWS_REGION} > /dev/null
success "Registered Task Definition: ${CLUSTER_NAME}-suv-ui"

# Cleanup temp files
rm -f /tmp/db-task-def.json /tmp/api-task-def.json /tmp/frontend-task-def.json /tmp/suv-ui-task-def.json

# ========================================
# Step 7: Create Service Discovery Namespace
# ========================================
info "Setting up Service Discovery..."

NAMESPACE_ID=$(aws servicediscovery list-namespaces \
    --query "Namespaces[?Name=='${CLUSTER_NAME}.local'].Id" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ -z "$NAMESPACE_ID" ] || [ "$NAMESPACE_ID" == "None" ]; then
    info "Creating Service Discovery Namespace..."
    OPERATION_ID=$(aws servicediscovery create-private-dns-namespace \
        --name "${CLUSTER_NAME}.local" \
        --vpc ${VPC_ID} \
        --query 'OperationId' \
        --output text \
        --region ${AWS_REGION})
    
    # Wait for namespace creation to complete
    info "Waiting for namespace creation to complete..."
    sleep 15
    
    # Get the namespace ID after creation
    NAMESPACE_ID=$(aws servicediscovery list-namespaces \
        --query "Namespaces[?Name=='${CLUSTER_NAME}.local'].Id" \
        --output text \
        --region ${AWS_REGION})
    
    if [ -z "$NAMESPACE_ID" ] || [ "$NAMESPACE_ID" == "None" ]; then
        error "Failed to create Service Discovery Namespace"
        exit 1
    fi
    success "Created Service Discovery Namespace: ${NAMESPACE_ID}"
else
    success "Using existing Service Discovery Namespace: ${NAMESPACE_ID}"
fi

# ========================================
# Step 8: Create ECS Services
# ========================================
info "Creating ECS Services..."

# Function to create service
create_ecs_service() {
    local service_name=$1
    local task_family=$2
    local container_port=$3
    local service_discovery_name=$4
    
    # Check if service exists
    SERVICE_STATUS=$(aws ecs describe-services \
        --cluster ${CLUSTER_NAME} \
        --services ${service_name} \
        --query "services[0].status" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null)
    
    if [ "$SERVICE_STATUS" == "ACTIVE" ]; then
        info "Updating existing service: ${service_name}"
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service ${service_name} \
            --task-definition ${task_family} \
            --force-new-deployment \
            --region ${AWS_REGION} > /dev/null
        success "Updated service: ${service_name}"
    else
        info "Creating service: ${service_name}"
        
        # Create service discovery service first
        SD_SERVICE_ID=$(aws servicediscovery list-services \
            --query "Services[?Name=='${service_discovery_name}'].Id" \
            --output text \
            --region ${AWS_REGION} 2>/dev/null)
        
        if [ -z "$SD_SERVICE_ID" ] || [ "$SD_SERVICE_ID" == "None" ]; then
            info "Creating service discovery for: ${service_discovery_name}"
            
            # Create DNS config JSON file
            cat > /tmp/dns-config.json << DNSEOF
{
    "NamespaceId": "${NAMESPACE_ID}",
    "DnsRecords": [
        {
            "Type": "A",
            "TTL": 60
        }
    ]
}
DNSEOF
            
            SD_SERVICE_ARN=$(aws servicediscovery create-service \
                --name "${service_discovery_name}" \
                --namespace-id "${NAMESPACE_ID}" \
                --dns-config file:///tmp/dns-config.json \
                --query 'Service.Arn' \
                --output text \
                --region ${AWS_REGION})
            
            rm -f /tmp/dns-config.json
        else
            SD_SERVICE_ARN=$(aws servicediscovery get-service \
                --id ${SD_SERVICE_ID} \
                --query 'Service.Arn' \
                --output text \
                --region ${AWS_REGION})
        fi
        
        aws ecs create-service \
            --cluster ${CLUSTER_NAME} \
            --service-name ${service_name} \
            --task-definition ${task_family} \
            --desired-count 1 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${SUBNET1_ID},${SUBNET2_ID}],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}" \
            --service-registries "registryArn=${SD_SERVICE_ARN}" \
            --region ${AWS_REGION} > /dev/null
        
        success "Created service: ${service_name}"
    fi
}

# Create services in order (db first, then api, then frontends)
create_ecs_service "${CLUSTER_NAME}-db-service" "${CLUSTER_NAME}-db" 5432 "db"

info "Waiting for database to be healthy..."
sleep 30

create_ecs_service "${CLUSTER_NAME}-api-service" "${CLUSTER_NAME}-api" 8000 "api"
create_ecs_service "${CLUSTER_NAME}-frontend-service" "${CLUSTER_NAME}-frontend" 3000 "frontend"
create_ecs_service "${CLUSTER_NAME}-suv-ui-service" "${CLUSTER_NAME}-suv-ui" 3030 "suv-ui"

# ========================================
# Summary
# ========================================
echo ""
echo "=========================================="
echo "           DEPLOYMENT SUMMARY"
echo "=========================================="
echo ""
success "ECS Deployment Complete!"
echo ""
info "Resources Created/Updated:"
echo "  • VPC: ${VPC_ID}"
echo "  • Subnets: ${SUBNET1_ID}, ${SUBNET2_ID}"
echo "  • Security Group: ${SG_ID}"
echo "  • ECS Cluster: ${CLUSTER_NAME}"
echo "  • Services: db, api, frontend, suv_ui"
echo ""
info "Service Discovery Endpoints (internal):"
echo "  • Database: db.${CLUSTER_NAME}.local:5432"
echo "  • API: api.${CLUSTER_NAME}.local:8000"
echo "  • Frontend: frontend.${CLUSTER_NAME}.local:3000"
echo "  • SUV UI: suv-ui.${CLUSTER_NAME}.local:3030"
echo ""
info "To check service status:"
echo "  aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${CLUSTER_NAME}-api-service --region ${AWS_REGION}"
echo ""
info "To view logs:"
echo "  aws logs tail /ecs/${CLUSTER_NAME}/api_service --follow --region ${AWS_REGION}"
echo ""
warning "Note: Services are running with public IPs but no load balancer."
warning "For production, consider adding an Application Load Balancer."
echo ""
success "Deployment script completed!"
