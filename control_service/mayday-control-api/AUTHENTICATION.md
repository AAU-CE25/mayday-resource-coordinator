# MayDay Control API - Authentication Setup

## Overview

The MayDay Control API now supports two Lambda functions sharing the same API Gateway with different paths and authentication:

1. **Authentication Lambda** (`auth_handler.py`) - Handles login and token verification
2. **ECS Scaling Lambda** (`ecs_scaling_handler.py`) - Controls ECS service scaling (protected by authentication)

## Architecture

```
API Gateway (HTTP API)
├── POST /login          → auth_handler.lambda_handler (no auth)
└── POST /scale          → ecs_scaling_handler.lambda_handler (auth required)
    └── Authorizer       → auth_handler.lambda_handler (validates token)
```

## API Endpoints

### 1. Login Endpoint
**Endpoint:** `POST /login`  
**Authentication:** None required  
**Request Body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Success Response (200):**
```json
{
  "token": "secure-random-token-here",
  "username": "admin"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### 2. ECS Scaling Endpoint
**Endpoint:** `POST /scale`  
**Authentication:** Required (Bearer token in Authorization header)  
**Headers:**
```
Authorization: Bearer <token-from-login>
Content-Type: application/json
```

**Request Body:**
```json
{
  "cluster_name": "mayday-cluster",
  "service_name": "mayday-cluster-api-service",
  "desired_count": 1
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Service updated successfully",
  "cluster": "mayday-cluster",
  "service": "mayday-cluster-api-service",
  "desired_count": 1,
  "running_count": 0,
  "pending_count": 1,
  "alb_url": "http://mayday-cluster-alb-1234567890.eu-central-1.elb.amazonaws.com"
}
```

## Lambda Functions

### Authentication Lambda (`auth_handler.py`)

**Dual Purpose:**
1. **Login Handler** - Validates credentials and issues tokens
2. **API Gateway Authorizer** - Validates tokens for protected routes

**Environment Variables:**
- `USERS_TABLE`: DynamoDB table name (default: `mayday-admin-users`)

**DynamoDB Schema:**
- **Partition Key:** `username` (String)
- **Attributes:** `password_hash`, `clusterName`, `auth_token`, `token_expiration`, `created_at`

### ECS Scaling Lambda (`ecs_scaling_handler.py`)

**Purpose:** Controls ECS service scaling operations

**Required IAM Permissions:**
- ECS: `UpdateService`, `DescribeServices`, `ListServices`, etc.
- ELB: `DescribeLoadBalancers`, `DescribeTargetGroups`
- CloudWatch: `GetMetricStatistics`, `ListMetrics`

## Terraform Configuration

### Modules Structure

```
infra/terraform-core/
├── main.tf
└── modules/
    ├── admins-db/          # DynamoDB table for admin users
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── mayday-control-api/ # Lambda functions and API Gateway
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### Key Resources

**API Gateway:**
- HTTP API with CORS support
- Two routes: `/login` (public) and `/scale` (protected)
- Custom REQUEST authorizer using auth Lambda

**Lambda Functions:**
- `mayday-control-api-ecs`: ECS scaling handler
- `mayday-control-api-auth`: Authentication handler + authorizer

**DynamoDB:**
- Table: `mayday-control-api-admin-users`
- Billing: PAY_PER_REQUEST
- Primary Key: `username`

## Setup Instructions

### 1. Deploy Infrastructure

```bash
cd infra/terraform-core
terraform init
terraform plan
terraform apply
```

### 2. Create Admin User

```bash
cd control_service/scripts
python add_admin_user.py
```

Follow the prompts to create your first admin user.

### 3. Test Authentication Flow

**Login:**
```bash
API_URL="https://jp3emi1qi8.execute-api.eu-central-1.amazonaws.com"

TOKEN=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.token')

echo "Token: $TOKEN"
```

**Scale Service:**
```bash
curl -X POST "$API_URL/scale" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cluster_name": "mayday-cluster",
    "service_name": "mayday-cluster-api-service",
    "desired_count": 1
  }'
```

### 4. Access Admin Portal

The admin portal is hosted on S3 and provides a web interface for:
- User authentication
- Service control (turn on/off)
- Real-time status updates

**URL:** Check Terraform outputs for S3 website URL

## Security Features

1. **Token-Based Authentication**
   - Secure random tokens generated with `secrets.token_urlsafe(32)`
   - 24-hour token expiration
   - Tokens stored in DynamoDB with expiration timestamp

2. **Password Security**
   - SHA-256 password hashing
   - Passwords never stored in plain text

3. **API Gateway Authorizer**
   - Validates tokens before allowing access to protected routes
   - Returns `isAuthorized: true/false` in Lambda authorizer format v2.0

4. **CORS Protection**
   - Configurable allowed origins
   - Proper CORS headers for browser-based clients

## Authentication Flow

```
1. User → POST /login → Auth Lambda
   ├─ Verify credentials against DynamoDB
   ├─ Generate secure token
   ├─ Store token with expiration
   └─ Return token to user

2. User → POST /scale + Bearer token → API Gateway
   ├─ API Gateway invokes Auth Lambda (Authorizer)
   ├─ Auth Lambda validates token
   │   ├─ Check token exists in DynamoDB
   │   ├─ Check token not expired
   │   └─ Return isAuthorized: true/false
   └─ If authorized: invoke ECS Lambda
       └─ Scale ECS service
```

## Troubleshooting

### 401 Unauthorized
- Check token is valid and not expired (24-hour limit)
- Verify Authorization header format: `Bearer <token>`
- Ensure token matches stored value in DynamoDB

### 403 Forbidden
- Verify user exists in DynamoDB
- Check Lambda has DynamoDB permissions
- Confirm IAM role policy includes dynamodb:GetItem, PutItem, UpdateItem, Scan

### Token Not Found
- User may need to log in again
- Check DynamoDB table exists and is accessible
- Verify USERS_TABLE environment variable is set correctly

## Monitoring

**CloudWatch Log Groups:**
- `/aws/lambda/mayday-control-api-ecs` - ECS scaling logs
- `/aws/lambda/mayday-control-api-auth` - Authentication logs
- `/aws/apigateway/mayday-control-api` - API Gateway access logs

**Key Metrics to Monitor:**
- Lambda invocation count and errors
- API Gateway 4xx/5xx errors
- DynamoDB read/write capacity (if using provisioned mode)
- Token expiration rate

## Development

### Local Testing

**Test auth_handler locally:**
```python
import json
from auth_handler import lambda_handler

# Test login
event = {
    'requestContext': {
        'http': {
            'method': 'POST',
            'path': '/login'
        }
    },
    'body': json.dumps({
        'username': 'admin',
        'password': 'test123'
    })
}

response = lambda_handler(event, None)
print(json.dumps(response, indent=2))
```

### Adding New Users

Use the provided script:
```bash
python control_service/scripts/add_admin_user.py
```

Or manually add to DynamoDB:
```python
import boto3
import hashlib

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('mayday-control-api-admin-users')

table.put_item(Item={
    'username': 'newuser',
    'password_hash': hashlib.sha256('password123'.encode()).hexdigest(),
    'clusterName': 'mayday-cluster',
    'created_at': '2025-12-10T12:00:00Z'
})
```

## Future Enhancements

- [ ] Add user roles and permissions (admin, operator, viewer)
- [ ] Implement token refresh mechanism
- [ ] Add audit logging for all operations
- [ ] Support for multiple clusters per user
- [ ] Rate limiting on login attempts
- [ ] Password complexity requirements
- [ ] MFA support
