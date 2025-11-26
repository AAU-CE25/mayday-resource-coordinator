# CORS Configuration for Cloud Deployment

## Overview

The API service is configured to allow cross-origin requests (CORS) from the Frontend and SUV UI services. This is essential for the services to communicate when deployed in the cloud with different LoadBalancer URLs.

## How It Works

### 1. **Local Development**
In local development, CORS is configured for localhost URLs:
- `http://localhost:3000` - Frontend
- `http://localhost:3030` - SUV UI
- `http://localhost:5173` - Vite dev server

### 2. **Kubernetes Internal Communication**
For pod-to-pod communication within the cluster:
- `http://api-service.mayday.svc.cluster.local`
- `http://frontend-service.mayday.svc.cluster.local`
- `http://suv-ui-service.mayday.svc.cluster.local`

### 3. **Cloud LoadBalancer URLs** (Automatic)
When deployed to EKS, the system automatically:
1. Retrieves the LoadBalancer URLs for all services
2. Updates the ConfigMap with these URLs
3. Restarts the API service to apply the new CORS configuration

The URLs are injected as environment variables:
- `FRONTEND_URL` - Frontend LoadBalancer URL
- `SUV_UI_URL` - SUV UI LoadBalancer URL
- `API_URL` - API LoadBalancer URL

## Automatic Configuration

The GitHub Actions workflow (`deploy-to-eks.yml`) automatically configures CORS during deployment:

```yaml
- name: Configure CORS URLs
  run: |
    # Gets LoadBalancer URLs
    # Updates ConfigMap
    # Restarts API service
```

This happens automatically - **no manual intervention required!**

## Manual Configuration

If you need to manually update CORS URLs (e.g., after redeployment with new LoadBalancers):

### Option 1: Using the Script (Recommended)

```bash
./k8s/update-cors-urls.sh
```

This script will:
1. Fetch all LoadBalancer URLs
2. Update the ConfigMap
3. Restart the API service
4. Display the URLs

### Option 2: Manual kubectl Commands

```bash
# Get LoadBalancer URLs
kubectl get svc -n mayday

# Update ConfigMap
kubectl patch configmap mayday-config -n mayday --type merge -p '{
  "data": {
    "FRONTEND_URL": "http://your-frontend-lb-url.elb.amazonaws.com",
    "SUV_UI_URL": "http://your-suv-lb-url.elb.amazonaws.com",
    "API_URL": "http://your-api-lb-url.elb.amazonaws.com"
  }
}'

# Restart API to pick up changes
kubectl rollout restart deployment api-service -n mayday
```

## Code Implementation

In `api_service/app/main.py`:

```python
# Static origins (local + k8s internal)
origins = [
    "http://localhost:3000",
    "http://localhost:3030",
    # ... other local URLs
    "http://api-service.mayday.svc.cluster.local",
    "http://frontend-service.mayday.svc.cluster.local",
    "http://suv-ui-service.mayday.svc.cluster.local",
]

# Dynamic origins from environment (LoadBalancer URLs)
import os
frontend_url = os.getenv("FRONTEND_URL")
suv_ui_url = os.getenv("SUV_UI_URL")
api_url = os.getenv("API_URL")

if frontend_url:
    origins.append(frontend_url)
    origins.append(frontend_url.replace("http://", "https://"))
# ... adds other URLs

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### CORS Errors in Browser Console

If you see CORS errors like:
```
Access to fetch at 'http://api-url...' from origin 'http://frontend-url...' 
has been blocked by CORS policy
```

**Solutions:**

1. **Check if CORS URLs are configured:**
```bash
kubectl get configmap mayday-config -n mayday -o yaml | grep -A 3 "FRONTEND_URL"
```

2. **Verify API logs:**
```bash
kubectl logs -f deployment/api-service -n mayday
```

3. **Re-run CORS configuration:**
```bash
./k8s/update-cors-urls.sh
```

4. **Check if API restarted after ConfigMap update:**
```bash
kubectl get pods -n mayday
# Look at the AGE of api-service pods - should be recent
```

### LoadBalancer URLs Not Available

If LoadBalancers are still provisioning:

```bash
# Check LoadBalancer status
kubectl get svc -n mayday

# Wait for EXTERNAL-IP to show (not <pending>)
# This can take 2-5 minutes after deployment
```

Once available, run:
```bash
./k8s/update-cors-urls.sh
```

## Security Considerations

### Production Recommendations:

1. **Use HTTPS**: Once you have a domain and SSL certificate:
   ```python
   origins = [
       "https://yourdomain.com",
       "https://suv.yourdomain.com",
   ]
   ```

2. **Restrict Origins**: Don't use `allow_origins=["*"]` in production

3. **Add Rate Limiting**: Consider adding rate limiting middleware

4. **Use API Gateway**: For production, consider AWS API Gateway or ALB with WAF

## Testing CORS

### Test from Browser Console:

```javascript
// Test API call from Frontend
fetch('http://your-api-url.elb.amazonaws.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Test with curl:

```bash
curl -H "Origin: http://your-frontend-url.elb.amazonaws.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://your-api-url.elb.amazonaws.com/health -v
```

You should see:
```
< Access-Control-Allow-Origin: http://your-frontend-url.elb.amazonaws.com
< Access-Control-Allow-Credentials: true
```

## Summary

✅ **Automatic**: CORS is configured automatically during GitHub Actions deployment  
✅ **Dynamic**: Adapts to new LoadBalancer URLs automatically  
✅ **Secure**: Only allows requests from known origins  
✅ **Flexible**: Easy to update manually if needed  

No manual CORS configuration needed for cloud deployments! 🎉
