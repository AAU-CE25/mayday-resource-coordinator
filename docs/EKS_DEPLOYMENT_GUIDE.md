# EKS Deployment Guide

This guide explains how to deploy your application to AWS EKS (Elastic Kubernetes Service) using GitHub Actions.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS EKS Cluster                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Namespace: mayday                      │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │ PostgreSQL  │  │ API Service │  │  Frontend   │     │  │
│  │  │   (PVC)     │  │  (2 pods)   │  │  (2 pods)   │     │  │
│  │  │  Internal   │  │ LoadBalancer│  │ LoadBalancer│     │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
│  │         │                 │                 │            │  │
│  │  ┌──────────────────────────────────────────────┐       │  │
│  │  │             SUV UI (2 pods)                  │       │  │
│  │  │             LoadBalancer                     │       │  │
│  │  └──────────────────────────────────────────────┘       │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  LoadBalancers   │
                    │  (Public URLs)   │
                    └──────────────────┘
```

---

## 📋 Prerequisites

### 1. Create an EKS Cluster

You need an EKS cluster first. Here are the options:

#### Option A: eksctl (Recommended - Easiest)

```bash
# Install eksctl
brew install eksctl

# Create cluster (takes ~15 minutes)
eksctl create cluster \
  --name mayday-cluster \
  --region eu-central-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed

# Verify cluster
kubectl get nodes
```

#### Option B: AWS Console

1. Go to AWS EKS Console
2. Click "Create cluster"
3. **Cluster name**: `mayday-cluster`
4. **Kubernetes version**: 1.28 or later
5. **Cluster service role**: Create new or select existing
6. **Networking**: Use default VPC or create new
7. **Cluster endpoint access**: Public
8. Click "Create"
9. Wait 10-15 minutes for cluster creation
10. Add node group:
    - **Name**: `standard-workers`
    - **Instance type**: `t3.medium`
    - **Desired size**: 2 nodes
    - **Min/Max**: 2-4 nodes

#### Option C: Terraform

```hcl
# Save as eks.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "mayday-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    standard = {
      min_size     = 2
      max_size     = 4
      desired_size = 2

      instance_types = ["t3.medium"]
    }
  }
}
```

### 2. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region eu-central-1 --name mayday-cluster

# Verify connection
kubectl get nodes
kubectl cluster-info
```

### 3. Install AWS Load Balancer Controller (Required for LoadBalancer services)

```bash
# Download IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.6.0/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Create IAM role and service account
eksctl create iamserviceaccount \
  --cluster=mayday-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::YOUR_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install controller with Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=mayday-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

---

## 🔐 GitHub Secrets Setup

Add these secrets to your GitHub repository:

**Go to: Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID_KAJ` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY_KAJ` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `POSTGRES_USER` | Database username | `mayday_user` |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `SECRET_KEY` | API secret key | `your-super-secret-key-change-in-production` |

---

## 🚀 Deployment Process

### Method 1: GitHub Actions (Recommended)

1. **Ensure EKS cluster exists** (see Prerequisites)

2. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Add EKS deployment"
   git push
   ```

3. **Trigger deployment**:
   - Go to GitHub → Actions → "Deploy to EKS"
   - Click "Run workflow"
   - Select environment: `production`
   - Select image tag: `latest` (or specific version)
   - Click "Run workflow"

4. **Monitor deployment**:
   - Watch the workflow progress
   - Check the "Deployment Summary" at the end
   - URLs will be displayed for API, Frontend, and SUV UI

5. **Access your application**:
   - The workflow summary will show all URLs
   - Click on the URLs to access your services

### Method 2: Manual Deployment (Local)

```bash
# 1. Configure kubectl
aws eks update-kubeconfig --region eu-central-1 --name mayday-cluster

# 2. Create namespace
kubectl apply -f k8s/namespace.yaml

# 3. Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# 4. Create Secrets
kubectl create secret generic mayday-secrets \
  --from-literal=POSTGRES_USER="mayday_user" \
  --from-literal=POSTGRES_PASSWORD="secure_password" \
  --from-literal=SECRET_KEY="your-secret-key" \
  --namespace=mayday

# 5. Update image references in manifests
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
for file in k8s/*-deployment.yaml; do
  sed -i "s|ACCOUNT_ID|$ACCOUNT_ID|g" $file
done

# 6. Deploy PostgreSQL
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml

# 7. Wait for PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres -n mayday --timeout=300s

# 8. Deploy API Service
kubectl apply -f k8s/api-deployment.yaml
kubectl wait --for=condition=ready pod -l app=api-service -n mayday --timeout=300s

# 9. Get API URL and update frontend/suv-ui
API_URL=$(kubectl get svc api-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "API URL: http://$API_URL"

# Update manifests with API URL
sed -i "s|http://API_SERVICE_URL|http://$API_URL|g" k8s/frontend-deployment.yaml
sed -i "s|http://API_SERVICE_URL|http://$API_URL|g" k8s/suv-ui-deployment.yaml

# 10. Deploy Frontend and SUV UI
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/suv-ui-deployment.yaml

# 11. Get all URLs
echo "Getting service URLs..."
kubectl get svc -n mayday
```

---

## 🌐 Getting Service URLs

After deployment, get your service URLs:

```bash
# Get all services
kubectl get svc -n mayday

# Get API URL
kubectl get svc api-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Get Frontend URL
kubectl get svc frontend-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Get SUV UI URL
kubectl get svc suv-ui-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**Note**: LoadBalancer URLs may take 2-5 minutes to become active.

---

## 📊 Monitoring and Management

### Check Deployment Status

```bash
# Get all resources
kubectl get all -n mayday

# Get pods
kubectl get pods -n mayday

# Get services
kubectl get svc -n mayday

# Get deployments
kubectl get deployments -n mayday
```

### View Logs

```bash
# API Service logs
kubectl logs -f deployment/api-service -n mayday

# Frontend logs
kubectl logs -f deployment/frontend -n mayday

# SUV UI logs
kubectl logs -f deployment/suv-ui -n mayday

# PostgreSQL logs
kubectl logs -f deployment/postgres -n mayday

# Get logs from all pods of a deployment
kubectl logs -f -l app=api-service -n mayday
```

### Scale Deployments

```bash
# Scale API service to 3 replicas
kubectl scale deployment api-service --replicas=3 -n mayday

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n mayday

# Auto-scale based on CPU
kubectl autoscale deployment api-service --cpu-percent=70 --min=2 --max=5 -n mayday
```

### Update Deployments

```bash
# Restart a deployment (rolling update)
kubectl rollout restart deployment/api-service -n mayday

# Check rollout status
kubectl rollout status deployment/api-service -n mayday

# Rollback to previous version
kubectl rollout undo deployment/api-service -n mayday
```

### Access Database

```bash
# Port-forward to access database locally
kubectl port-forward svc/postgres-service 5432:5432 -n mayday

# Then connect with psql or any DB client to localhost:5432
psql -h localhost -p 5432 -U mayday_user -d mayday_db
```

---

## 🔧 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n mayday

# Describe pod to see events
kubectl describe pod <pod-name> -n mayday

# Check pod logs
kubectl logs <pod-name> -n mayday
```

### Image Pull Errors

```bash
# Verify ECR login
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com

# Check if images exist in ECR
aws ecr list-images --repository-name api_service --region eu-central-1

# Verify service account has ECR access
kubectl describe serviceaccount default -n mayday
```

### LoadBalancer Not Getting External IP

```bash
# Check if AWS Load Balancer Controller is running
kubectl get pods -n kube-system | grep aws-load-balancer-controller

# Check service events
kubectl describe svc api-service -n mayday

# Verify security groups allow traffic
# Check AWS Console → EC2 → Load Balancers
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
kubectl get pods -l app=postgres -n mayday

# Check PostgreSQL logs
kubectl logs -f deployment/postgres -n mayday

# Verify secrets are created
kubectl get secrets -n mayday
kubectl describe secret mayday-secrets -n mayday

# Test database connection from API pod
kubectl exec -it deployment/api-service -n mayday -- env | grep POSTGRES
```

---

## 💰 Cost Estimation

### EKS Cluster Costs (eu-central-1)

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| **EKS Control Plane** | Per cluster | $73 |
| **Worker Nodes** | 2x t3.medium | ~$60 |
| **EBS Volumes** | 10GB for DB | ~$1 |
| **Load Balancers** | 3x ALB | ~$50 |
| **Data Transfer** | Moderate usage | ~$10 |
| **Total** | | **~$194/month** |

### Cost Optimization Tips:

1. **Use Spot Instances** for non-production:
   ```bash
   eksctl create nodegroup --spot --instance-types=t3.medium,t3a.medium
   ```

2. **Right-size resources**:
   - Monitor actual usage
   - Reduce CPU/memory limits if over-provisioned

3. **Auto-scaling**:
   - Scale to zero during off-hours
   - Use cluster autoscaler

4. **Delete unused resources**:
   ```bash
   # Delete the entire namespace
   kubectl delete namespace mayday
   ```

5. **Use shared ALB** with Ingress instead of multiple LoadBalancers

---

## 🔒 Security Best Practices

1. **Use Secrets for sensitive data** (not ConfigMaps)
2. **Enable Pod Security Standards**
3. **Use Network Policies** to restrict traffic
4. **Enable encryption at rest** for EBS volumes
5. **Regularly update** EKS version and node AMIs
6. **Use IAM roles** for service accounts (IRSA)
7. **Enable audit logging** in EKS
8. **Scan container images** for vulnerabilities

---

## 🔄 CI/CD Workflow

Complete workflow from code to production:

```
1. Code changes → Push to GitHub
2. Create release → Triggers ECR build
3. Images pushed to ECR
4. Run "Deploy to EKS" workflow
5. Application deployed to EKS
6. Access via LoadBalancer URLs
```

---

## 🎯 Next Steps

1. **Set up domain names**:
   - Configure Route53
   - Point domains to LoadBalancer
   - Use Ingress with SSL/TLS

2. **Add monitoring**:
   - Install Prometheus & Grafana
   - Set up CloudWatch Container Insights
   - Configure alerts

3. **Implement CI/CD pipeline**:
   - Auto-deploy on release
   - Run tests before deployment
   - Blue-green deployments

4. **Add backup strategy**:
   - Velero for cluster backups
   - RDS snapshots for database
   - S3 for persistent data

5. **Optimize costs**:
   - Use Spot instances
   - Implement autoscaling
   - Schedule scale-down during off-hours

---

## 📚 Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [eksctl Documentation](https://eksctl.io/)

---

**Need help?** Check the troubleshooting section or reach out to your DevOps team.
