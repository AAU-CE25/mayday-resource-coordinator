# MayDay Control API - Quick Start

## What Changed

The API Gateway now supports **two Lambda functions** with **different paths** and **authentication**:

### Before
- Single Lambda function at `POST /`
- No authentication
- Single purpose (ECS scaling)

### After
- **Two Lambda functions** sharing one API Gateway:
  1. `POST /login` → Authentication Lambda (public)
  2. `POST /scale` → ECS Scaling Lambda (protected)
- Token-based authentication with API Gateway authorizer
- DynamoDB for user management

## Quick Test

### 1. Deploy
```bash
cd infra/terraform-core
terraform init
terraform apply
```

### 2. Create Admin User
```bash
cd ../../control_service/scripts
python add_admin_user.py
```

### 3. Test Login
```bash
API_URL="https://jp3emi1qi8.execute-api.eu-central-1.amazonaws.com"

curl -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

**Expected Response:**
```json
{
  "token": "very-long-random-token-string",
  "username": "admin"
}
```

### 4. Test ECS Scaling (with auth)
```bash
TOKEN="paste-token-from-step-3"

curl -X POST "$API_URL/scale" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cluster_name": "mayday-cluster",
    "service_name": "mayday-cluster-api-service",
    "desired_count": 1
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Service updated successfully",
  "cluster": "mayday-cluster",
  "service": "mayday-cluster-api-service",
  "desired_count": 1,
  "running_count": 0,
  "pending_count": 1
}
```

### 5. Test Without Auth (should fail)
```bash
curl -X POST "$API_URL/scale" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_name": "mayday-cluster",
    "service_name": "mayday-cluster-api-service",
    "desired_count": 1
  }'
```

**Expected Response:**
```json
{"message":"Unauthorized"}
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (HTTP API)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST /login  (No Auth)  →  Auth Lambda               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST /scale  (Auth Required)                          │ │
│  │    ↓                                                    │ │
│  │  API Gateway Authorizer → Auth Lambda (verify token)  │ │
│  │    ↓ (if authorized)                                   │ │
│  │  ECS Scaling Lambda                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                           │
         ↓                           ↓
    DynamoDB                    ECS Cluster
  (admin users)              (scale services)
```

## Key Files Modified

### Terraform
- `infra/terraform-core/main.tf` - Added `admins_db` module
- `infra/terraform-core/modules/mayday-control-api/main.tf` - Two Lambdas + authorizer
- `infra/terraform-core/modules/admins-db/main.tf` - DynamoDB table

### Lambda Functions
- `control_service/mayday-control-api/auth_handler.py` - Dual-purpose: login + authorizer
- `control_service/mayday-control-api/ecs_scaling_handler.py` - Unchanged (just renamed)

### Admin Portal
- `control_service/admin_portal/js/app.js` - Updated to use `/login` and `/scale` paths

## Troubleshooting

### "Unauthorized" on /scale endpoint
✅ **Solution:** Include valid token in Authorization header
```bash
-H "Authorization: Bearer your-token-here"
```

### "Invalid credentials" on /login
✅ **Solution:** Check username/password are correct in DynamoDB
```bash
aws dynamodb get-item \
  --table-name mayday-control-api-admin-users \
  --key '{"username":{"S":"admin"}}'
```

### Lambda can't access DynamoDB
✅ **Solution:** Check IAM policy includes DynamoDB permissions
- The policy in `modules/mayday-control-api/main.tf` includes:
  - `dynamodb:GetItem`
  - `dynamodb:PutItem`
  - `dynamodb:UpdateItem`
  - `dynamodb:Scan`

### Wrong API Gateway URL in admin portal
✅ **Solution:** Update `control_service/admin_portal/js/app.js`
```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-api-id.execute-api.eu-central-1.amazonaws.com',
    DEFAULT_CLUSTER: 'mayday-cluster'
};
```

## Next Steps

1. **Deploy infrastructure** → `terraform apply`
2. **Create admin user** → `python add_admin_user.py`
3. **Update admin portal** → Upload to S3 bucket
4. **Test authentication flow** → Login → Scale service
5. **Monitor CloudWatch Logs** → Check for errors

## Important Notes

⚠️ **Token Expiration:** Tokens expire after 24 hours  
⚠️ **Password Hashing:** Uses SHA-256 (consider bcrypt for production)  
⚠️ **CORS:** Currently allows all origins (`*`), restrict in production  
⚠️ **Rate Limiting:** Not implemented, consider adding AWS WAF rules

For detailed documentation, see `AUTHENTICATION.md`
