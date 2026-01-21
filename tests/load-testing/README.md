# Load Testing for MayDay API

This directory contains load testing scripts to test the scalability and autoscaling behavior of the MayDay API.

## Prerequisites

### For Bash Script (load-test.sh)
- Apache Bench (ab): `brew install httpd` (macOS) or `apt install apache2-utils` (Linux)
- curl
- jq (optional)

### For Python Script (load-test.py)
```bash
pip install -r requirements-load-test.txt
```

## Authentication Setup

Both scripts include built-in authentication:

### Bash Script
- Auto-creates test users with timestamp-based unique emails
- Obtains JWT token via `/auth/login`
- Includes token in `Authorization: Bearer <token>` header for authenticated requests

### Python/Locust Script
- Each simulated user registers and logs in automatically
- Token is stored and used for all subsequent requests
- Admin users can be configured via environment variables:
  ```bash
  export ADMIN_EMAIL="admin@example.com"
  export ADMIN_PASSWORD="your_admin_password"
  ```

### Verifying Authentication

**Option 1: Quick verification script**
```bash
python verify-auth.py
```
This will test:
- Registration
- Login (obtaining JWT token)
- Accessing protected endpoints with token
- Verifying unauthorized access is blocked

**Option 2: Check API logs**
```bash
# View API container logs
docker logs -f <api-container-id>

# Or via ECS
aws logs tail /aws/ecs/mayday-cluster/all --follow --filter-pattern "Authorization"
```

**Option 3: Monitor during load test**
```bash
# Run Locust with verbose logging
locust -f load-test.py --host http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com --loglevel DEBUG
```

## Quick Start

### Option 1: Bash Script (Simple)

```bash
# Make executable
chmod +x load-test.sh

# Interactive mode
./load-test.sh

# Command line mode
./load-test.sh health    # Health check only
./load-test.sh load      # Basic load test
./load-test.sh ramp      # Ramp-up test
./load-test.sh spike     # Spike test
./load-test.sh stress    # Stress test
./load-test.sh full      # Full test suite
```

### Option 2: Python/Locust (Advanced)

```bash
# Install dependencies
pip install -r requirements-load-test.txt

# Web UI mode (recommended)
locust -f load-test.py --host http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com

# Then open http://localhost:8089 in your browser
# Configure number of users and spawn rate in the web UI

# Headless mode
locust -f load-test.py \
  --host http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless
```

## Test Types

### 1. Health Check
Quick check to verify API is responding.

### 2. Basic Load Test
Tests health endpoint with concurrent users.

### 3. Authentication Load Test
Tests registration, login, and authenticated endpoints.

### 4. Ramp-Up Test
Gradually increases load from 10 to 200 concurrent users to test autoscaling behavior.

### 5. Spike Test
Simulates sudden traffic spike (10 → 500 → 10 users) to test elasticity.

### 6. Stress Test
Sustained high load (200 concurrent users) for extended period.

## Monitoring ECS During Tests

While running load tests, monitor ECS autoscaling:

```bash
# Watch service scaling
watch -n 2 'aws ecs describe-services \
  --cluster mayday-cluster \
  --services mayday-cluster-api-service \
  --query "services[0].[desiredCount,runningCount]" \
  --output table'

# Watch CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=mayday-cluster-api-service Name=ClusterName,Value=mayday-cluster \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

## Configuration

### Environment Variables
```bash
# API configuration
export API_URL="http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com"
export CONCURRENT_USERS=50
export REQUESTS_PER_USER=100
export DURATION=60

# Admin credentials (for testing admin endpoints)
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="your_admin_password"
```

## Expected Autoscaling Behavior

With the configured autoscaling:
- **Target tracking**: CPU utilization target at 50%
- **Min tasks**: 2
- **Max tasks**: 10
- **Scale-out**: When CPU > 50% for 2 minutes
- **Scale-in**: When CPU < 50% for 5 minutes

During load tests, you should observe:
1. Initial state: 2 running tasks
2. Load increases: CPU rises above 50%
3. After ~2 minutes: New tasks start launching
4. Load sustained: Tasks scale up to handle load (up to 10)
5. Load decreases: After ~5 minutes, tasks start scaling down
6. Final state: Returns to 2 running tasks

## Interpreting Results

### Key Metrics
- **Requests per second**: Throughput
- **Response time**: Latency (p50, p95, p99)
- **Error rate**: Failed requests / total requests
- **Connection errors**: Network issues

### Good Results
- Response time < 200ms (p95)
- Error rate < 1%
- Autoscaling responds within 2-3 minutes
- System remains stable under load

### Warning Signs
- Response time > 500ms
- Error rate > 5%
- Autoscaling doesn't trigger
- Tasks continuously restarting
