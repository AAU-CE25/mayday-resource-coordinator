# MayDay Control API

Lambda functions for authentication and ECS service control.

## Structure

```
mayday-control-api/
├── auth_handler.py           # Authentication Lambda handler
├── ecs_scaling_handler.py    # ECS service scaling handler
├── requirements.txt          # Python dependencies
├── README.md                 # This file
└── ECS_CONTROL.md           # ECS scaling documentation
```

## Handlers

### 1. Authentication Handler (`auth_handler.py`)

Handles user authentication with DynamoDB-backed user storage.

#### Features
- Username/password authentication
- Secure token generation
- Token expiration (24 hours)
- Token verification for protected routes

#### Environment Variables
- `USERS_TABLE`: DynamoDB table name for user storage (default: `mayday-admin-users`)

#### DynamoDB Table Schema

**Table Name**: `mayday-admin-users`

**Primary Key**: `username` (String)

**Attributes**:
- `username` (String) - Primary key
- `password_hash` (String) - SHA-256 hashed password
- `auth_token` (String) - Current auth token
- `token_expiration` (String) - ISO format timestamp
- `created_at` (String) - User creation timestamp

### 2. ECS Scaling Handler (`ecs_scaling_handler.py`)

Controls ECS service scaling operations.

#### Features
- Scale ECS services up/down
- Get ALB URLs for services
- Service status information

#### Required Parameters
```json
{
  "cluster_name": "mayday-cluster",
  "service_name": "mayday-cluster-api-service",
  "desired_count": 1
}
```

## API Endpoints

### Login
```
POST /login
Content-Type: application/json

{
  "username": "admin",
  "password": "yourpassword"
}

Response:
{
  "token": "generated-token-here",
  "username": "admin"
}
```

### Scale ECS Service
```
POST /
Authorization: Bearer <token>
Content-Type: application/json

{
  "cluster_name": "mayday-cluster",
  "service_name": "mayday-cluster-api-service",
  "desired_count": 2
}

Response:
{
  "status": "success",
  "cluster": "mayday-cluster",
  "service": "mayday-cluster-api-service",
  "desired_count": 2,
  "running_count": 1,
  "pending_count": 1,
  "deployment_count": 1,
  "alb_url": "http://your-alb.elb.amazonaws.com"
}
```

## Deployment

These Lambda functions are deployed via Terraform and integrated with API Gateway.

### Required IAM Permissions

**For Authentication:**
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:Scan"
  ],
  "Resource": "arn:aws:dynamodb:REGION:ACCOUNT:table/mayday-admin-users"
}
```

**For ECS Scaling:**
```json
{
  "Effect": "Allow",
  "Action": [
    "ecs:UpdateService",
    "ecs:DescribeServices",
    "ecs:ListServices",
    "elasticloadbalancing:DescribeLoadBalancers"
  ],
  "Resource": "*"
}
```

## User Management

### Adding Users

Use the script in `control_service/scripts/add_admin_user.py`:

```bash
python control_service/scripts/add_admin_user.py <username> <password>
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Password Hashing**: Currently uses SHA-256. Consider upgrading to bcrypt or Argon2 for production.
2. **Token Storage**: Tokens are stored in DynamoDB. Consider using AWS Secrets Manager for sensitive data.
3. **HTTPS Only**: Always use HTTPS in production.
4. **Rate Limiting**: Implement rate limiting on the login endpoint.
5. **Password Policy**: Enforce strong password requirements (minimum 8 characters).
6. **Token Rotation**: Implement token refresh mechanism for long-lived sessions.
7. **Authorization**: Add role-based access control for production use.

## Testing Locally

### Test Authentication
```python
{
  "requestContext": {
    "http": {
      "method": "POST",
      "path": "/login"
    }
  },
  "body": "{\"username\": \"admin\", \"password\": \"testpass123\"}"
}
```

### Test ECS Scaling
```python
{
  "headers": {
    "authorization": "Bearer your-token-here"
  },
  "body": "{\"cluster_name\": \"mayday-cluster\", \"service_name\": \"mayday-cluster-api-service\", \"desired_count\": 1}"
}
```

## Integration with Admin Portal

The admin portal (`control_service/admin_portal/`) provides a web interface for:
- User login
- Service ON/OFF control
- Real-time service status
- ALB endpoint access
