# MayDay Admin Portal

A lightweight static website for managing MayDay ECS cluster services.

## Structure

```
admin_portal/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Stylesheet
└── js/
    └── app.js          # JavaScript application logic
```

## Features

- **Service Control**: Turn ECS services ON/OFF
- **Real-time Feedback**: View service status, running count, and deployment info
- **Load Balancer Links**: Quick access to service ALB endpoints
- **Responsive Design**: Works on desktop and mobile devices

## Configuration

Update the API endpoint in `js/app.js`:

```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-api-gateway-url.amazonaws.com/',
    DEFAULT_CLUSTER: 'your-cluster-name'
};
```

## Deployment to S3

### Prerequisites
- AWS CLI configured
- S3 bucket created with static website hosting enabled
- Bucket policy configured for public read access

### Deploy
```bash
aws s3 sync . s3://your-bucket-name/ --exclude "README.md"
```

### With CloudFront
```bash
# Deploy to S3
aws s3 sync . s3://your-bucket-name/ --exclude "README.md"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Local Development

Simply open `index.html` in a web browser:
```bash
open index.html  # macOS
# or
xdg-open index.html  # Linux
# or
start index.html  # Windows
```

Or use a simple HTTP server:
```bash
python3 -m http.server 8080
# Then visit http://localhost:8080
```

## Services Supported

- **api-service**: Main API backend
- **frontend-service**: User-facing dashboard
- **suv-ui-service**: SUV (Search and Update Volunteer) interface

## API Integration

The portal connects to an AWS Lambda function via API Gateway that controls ECS services.

### Request Format
```json
{
  "cluster_name": "mayday-cluster",
  "service_name": "mayday-cluster-api-service",
  "desired_count": 1
}
```

### Response Format
```json
{
  "status": "success",
  "cluster": "mayday-cluster",
  "service": "mayday-cluster-api-service",
  "desired_count": 1,
  "running_count": 1,
  "pending_count": 0,
  "deployment_count": 1,
  "alb_url": "http://your-alb-url.elb.amazonaws.com"
}
```

## Security Notes

- This portal should be protected (CloudFront + Cognito, IP restrictions, etc.)
- API Gateway should have proper authentication
- Consider adding AWS Cognito for user authentication
- Use HTTPS only in production
