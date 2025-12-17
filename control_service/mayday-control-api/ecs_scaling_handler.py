import boto3
import json
from datetime import datetime

ecs = boto3.client('ecs')
elbv2 = boto3.client('elbv2')

def datetime_handler(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def get_alb_url(cluster_name):
    """Get the ALB DNS name for the cluster"""
    try:
        # List load balancers and find the one matching the cluster
        response = elbv2.describe_load_balancers()
        
        for lb in response.get('LoadBalancers', []):
            # Match load balancer by name pattern or tags
            if cluster_name.lower() in lb.get('LoadBalancerName', '').lower():
                return f"http://{lb.get('DNSName')}"
        
        return None
    except Exception as e:
        print(f"Error fetching ALB URL: {str(e)}")
        return None

def lambda_handler(event, context):
    """
    event should contain (direct invocation):
    {
        "cluster_name": "my-cluster",
        "service_name": "api_service",
        "desired_count": 3
    }
    
    Or via API Gateway (payload format 2.0):
    {
        "body": "{\"cluster_name\":\"my-cluster\",\"service_name\":\"api_service\",\"desired_count\":3}"
    }
    """
    try:
        # Check if this is from API Gateway (has 'body' field)
        if 'body' in event:
            # Parse the JSON body from API Gateway
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            # Direct Lambda invocation
            body = event
        
        cluster = body['cluster_name']
        service = body['service_name']
        desired_count = int(body['desired_count'])

        response = ecs.update_service(
            cluster=cluster,
            service=service,
            desiredCount=desired_count
        )

        # Extract only the relevant information from the response
        service_info = response.get('service', {})
        
        # Get ALB URL for the cluster
        alb_url = get_alb_url(cluster)
        
        response_body = {
            "status": "success",
            "cluster": cluster,
            "service": service,
            "desired_count": desired_count,
            "service_arn": service_info.get('serviceArn'),
            "running_count": service_info.get('runningCount'),
            "pending_count": service_info.get('pendingCount'),
            "deployment_count": len(service_info.get('deployments', [])),
            "alb_url": alb_url
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(response_body)
        }
    
    except KeyError as e:
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "status": "error",
                "message": f"Missing required parameter: {str(e)}"
            })
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "status": "error",
                "message": str(e)
            })
        }
