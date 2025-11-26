#!/bin/bash
# Script to update CORS URLs in ConfigMap after LoadBalancers are provisioned

set -e

NAMESPACE="mayday"
CLUSTER_NAME="mayday-cluster"
REGION="eu-central-1"

echo "🔍 Fetching LoadBalancer URLs..."
echo ""

# Get LoadBalancer URLs
FRONTEND_URL=$(kubectl get service frontend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
SUV_UI_URL=$(kubectl get service suv-ui-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
API_URL=$(kubectl get service api-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$FRONTEND_URL" ] || [ -z "$SUV_UI_URL" ] || [ -z "$API_URL" ]; then
    echo "❌ Error: Could not retrieve all LoadBalancer URLs"
    echo "   Make sure all services are deployed and LoadBalancers are provisioned"
    echo "   This can take 2-3 minutes after deployment"
    exit 1
fi

# Add http:// prefix
FRONTEND_URL="http://$FRONTEND_URL"
SUV_UI_URL="http://$SUV_UI_URL"
API_URL="http://$API_URL"

echo "Found URLs:"
echo "  Frontend: $FRONTEND_URL"
echo "  SUV UI:   $SUV_UI_URL"
echo "  API:      $API_URL"
echo ""

echo "📝 Updating ConfigMap with CORS URLs..."

# Update ConfigMap
kubectl patch configmap mayday-config -n $NAMESPACE --type merge -p "{
  \"data\": {
    \"FRONTEND_URL\": \"$FRONTEND_URL\",
    \"SUV_UI_URL\": \"$SUV_UI_URL\",
    \"API_URL\": \"$API_URL\"
  }
}"

echo "✅ ConfigMap updated successfully!"
echo ""
echo "🔄 Restarting API deployment to pick up new CORS settings..."

# Restart API deployment to pick up new environment variables
kubectl rollout restart deployment api-service -n $NAMESPACE

echo "⏳ Waiting for API rollout to complete..."
kubectl rollout status deployment api-service -n $NAMESPACE --timeout=120s

echo ""
echo "═══════════════════════════════════════════"
echo "✅ CORS URLs configured successfully!"
echo "═══════════════════════════════════════════"
echo ""
echo "Your services are now accessible at:"
echo "  🌐 Frontend: $FRONTEND_URL"
echo "  🚗 SUV UI:   $SUV_UI_URL"
echo "  🔌 API:      $API_URL"
echo ""
echo "CORS is now configured to allow cross-origin requests between all services."
