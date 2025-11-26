# EKS On/Off Control Guide

Quick guide for managing your EKS deployment lifecycle.

---

## 🎛️ Control Actions

The `eks-control.yml` workflow provides 4 actions:

### 1. 🚀 **DEPLOY** - Deploy fresh application
- Creates namespace, ConfigMaps, Secrets
- Deploys PostgreSQL with persistent storage
- Deploys API Service, Frontend, SUV UI
- Provisions LoadBalancers and gets URLs
- **When to use**: First deployment or after deleting namespace

### 2. 🛑 **STOP** - Stop application (save costs)
- Scales all deployments to 0 replicas
- **Keeps database data** (PVC preserved)
- Removes LoadBalancers (saves ~$50/month)
- Stops all pods (saves ~$60/month)
- **When to use**: Off-hours, weekends, development pause

### 3. 🔄 **RESTART** - Start application again
- Scales PostgreSQL back up (data intact)
- Scales API, Frontend, SUV UI to specified replicas
- LoadBalancers are recreated automatically
- **When to use**: Resume after STOP action

### 4. 📊 **STATUS** - Check current state
- Shows all deployments, pods, services
- Displays PVCs and their status
- **When to use**: Verify deployment state

---

## 🚀 How to Use

### Via GitHub Actions UI

1. **Go to GitHub Repository**
   - Navigate to: `Actions` tab
   - Click on: `EKS On/Off Control`

2. **Click "Run workflow"**

3. **Select Action**:
   - `deploy` - Full deployment
   - `stop` - Stop everything
   - `restart` - Start again
   - `status` - Check status

4. **Configure Options** (for deploy/restart):
   - **Image tag**: `latest` or specific version (e.g., `v1.0.0`)
   - **Scale replicas**: `1`, `2`, `3`, or `4` pods per service

5. **Click "Run workflow"**

6. **Monitor Progress**:
   - Watch the workflow run
   - Check the summary for URLs

---

## 💰 Cost Savings

### Running State
```
EKS Control Plane:     $73/month
Worker Nodes (2x):     $60/month
LoadBalancers (3x):    $50/month
Storage (10GB):        $1/month
──────────────────────────────────
TOTAL:                 ~$194/month
```

### Stopped State (STOP action)
```
EKS Control Plane:     $73/month
Worker Nodes (idle):   $60/month
LoadBalancers:         $0/month     ✅ REMOVED
Pods:                  $0/month     ✅ STOPPED
Storage (10GB):        $1/month     ✅ DATA PRESERVED
──────────────────────────────────
TOTAL:                 ~$134/month
SAVINGS:               $60/month (31% reduction)
```

### Best Practice for Cost Optimization
```bash
# Work hours (8am-6pm weekdays): RUNNING
# Off-hours, weekends: STOPPED

Monthly savings: ~$120 (62% reduction)
```

---

## 📋 Common Scenarios

### Scenario 1: Daily Development Cycle
```
Monday 8 AM:
  → Run workflow: RESTART (replicas: 2)
  → Access URLs, start working

Monday 6 PM:
  → Run workflow: STOP
  → Save costs overnight

Tuesday 8 AM:
  → Run workflow: RESTART (replicas: 2)
  → Continue working (data intact!)
```

### Scenario 2: Demo/Presentation
```
Before demo:
  → Run workflow: DEPLOY (replicas: 3) for high availability
  → Get URLs, share with stakeholders

After demo:
  → Run workflow: STOP
  → No ongoing costs
```

### Scenario 3: Production Deployment
```
Release day:
  → Run workflow: DEPLOY (image_tag: v1.0.0, replicas: 4)
  → Monitor with STATUS action
  → Keep running 24/7
```

### Scenario 4: Troubleshooting
```
Issue reported:
  → Run workflow: STATUS
  → Check pod status
  → View logs via kubectl
  → Run workflow: RESTART if needed
```

---

## 🔍 Checking Status

### Via Workflow
1. Run workflow with action: `status`
2. View summary showing all resources

### Via kubectl (Local)
```bash
# Configure kubectl
aws eks update-kubeconfig --region eu-central-1 --name mayday-cluster

# Check everything
kubectl get all -n mayday

# Check if running or stopped
kubectl get deployments -n mayday

# If replicas = 0, it's STOPPED
# If replicas > 0, it's RUNNING
```

### Quick Status Check
```bash
# See if pods are running
kubectl get pods -n mayday

# No pods = STOPPED
# Pods running = ACTIVE
```

---

## 🌐 Getting URLs After Restart

URLs are automatically shown in the workflow summary, but you can also get them manually:

```bash
# Configure kubectl first
aws eks update-kubeconfig --region eu-central-1 --name mayday-cluster

# Get all service URLs
kubectl get svc -n mayday

# Get specific URLs
kubectl get svc api-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
kubectl get svc frontend-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
kubectl get svc suv-ui-service -n mayday -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**Note**: After RESTART, LoadBalancers take 2-5 minutes to provision new URLs.

---

## ⚠️ Important Notes

### Database Data
- ✅ **STOP action preserves all database data**
- ✅ Data is stored in PVC (Persistent Volume Claim)
- ✅ Survives STOP/RESTART cycles
- ⚠️ Only deleted if you delete the namespace entirely

### LoadBalancer URLs
- ⚠️ URLs **may change** after STOP/RESTART
- 💡 Use DNS names (Route53) for stable URLs
- 💡 Update frontend URLs after restart

### Worker Nodes
- 💡 Nodes keep running even when pods are stopped
- 💡 For maximum savings, scale nodes to 0 or delete node group
- ⚠️ Recreating nodes takes ~5 minutes

---

## 🛠️ Advanced: Manual Control

### Stop via kubectl
```bash
# Scale all to zero
kubectl scale deployment api-service --replicas=0 -n mayday
kubectl scale deployment frontend --replicas=0 -n mayday
kubectl scale deployment suv-ui --replicas=0 -n mayday
kubectl scale deployment postgres --replicas=0 -n mayday
```

### Restart via kubectl
```bash
# Scale back up
kubectl scale deployment postgres --replicas=1 -n mayday
kubectl scale deployment api-service --replicas=2 -n mayday
kubectl scale deployment frontend --replicas=2 -n mayday
kubectl scale deployment suv-ui --replicas=2 -n mayday
```

### Complete Deletion (⚠️ Destroys everything)
```bash
# Delete entire namespace (including data!)
kubectl delete namespace mayday

# Or delete resources individually
kubectl delete -f k8s/ -n mayday
```

---

## 📊 Monitoring After Actions

### After DEPLOY
```bash
# Watch pods come up
kubectl get pods -n mayday -w

# Check logs
kubectl logs -f deployment/api-service -n mayday

# Get URLs
kubectl get svc -n mayday
```

### After STOP
```bash
# Verify all pods are gone
kubectl get pods -n mayday
# Should show "No resources found" or all in Terminating state

# Verify PVC still exists
kubectl get pvc -n mayday
# Should show postgres-pvc with status Bound
```

### After RESTART
```bash
# Watch pods start
kubectl get pods -n mayday -w

# Wait for LoadBalancers
kubectl get svc -n mayday -w
# Watch EXTERNAL-IP change from <pending> to actual URL
```

---

## 🎯 Quick Decision Guide

**Should I use STOP or DELETE?**

| Goal | Action | Result |
|------|--------|--------|
| Save costs overnight | **STOP** | Data preserved, easy restart |
| Weekend break | **STOP** | Data preserved, resume Monday |
| Project paused for weeks | **STOP** or scale nodes to 0 | Minimal costs |
| Project completed | **DELETE namespace** | Everything removed |
| Testing new version | **DEPLOY** with new tag | Fresh deployment |
| Something broken | **RESTART** | Fresh start, data intact |

---

## 📞 Troubleshooting

### Workflow fails with "cluster not found"
- Ensure EKS cluster `mayday-cluster` exists in `eu-central-1`
- Check AWS credentials are correct

### Pods stuck in Pending after RESTART
```bash
# Check events
kubectl describe pod <pod-name> -n mayday

# Common causes:
# - Insufficient nodes (wait or scale node group)
# - Image pull errors (check ECR permissions)
# - PVC mounting issues (check EBS volume)
```

### LoadBalancer stuck in <pending>
```bash
# Check if Load Balancer Controller is running
kubectl get pods -n kube-system | grep aws-load-balancer-controller

# If not found, install it (see EKS_DEPLOYMENT_GUIDE.md)
```

### URLs not accessible after RESTART
- Wait 2-5 minutes for LoadBalancer provisioning
- Check security groups allow inbound traffic (ports 80, 443)
- Verify AWS Load Balancer Controller is installed

---

## 🎉 Summary

**DEPLOY**: Full fresh deployment  
**STOP**: Turn off (save $60+/month)  
**RESTART**: Turn on (data preserved)  
**STATUS**: Check what's running  

**Data is safe** with STOP/RESTART cycle!

Use STOP during off-hours to save ~62% on costs while keeping your data ready for quick restart.

---

**Need help?** Check the logs or run STATUS action to diagnose issues.
