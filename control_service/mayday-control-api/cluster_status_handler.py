import boto3
import json

ecs_client = boto3.client('ecs')
elbv2_client = boto3.client('elbv2')

def get_alb_for_cluster(cluster_name):
    """Find ALB associated with the cluster"""
    try:
        response = elbv2_client.describe_load_balancers()
        
        for lb in response.get('LoadBalancers', []):
            lb_name = lb.get('LoadBalancerName', '')
            if cluster_name.lower() in lb_name.lower():
                return {
                    'name': lb_name,
                    'dns_name': lb.get('DNSName'),
                    'arn': lb.get('LoadBalancerArn'),
                    'scheme': lb.get('Scheme'),
                    'type': lb.get('Type'),
                    'state': lb.get('State', {}).get('Code')
                }
        
        return None
    except Exception as e:
        print(f"Error getting ALB: {str(e)}")
        return None

def get_cluster_services(cluster_name):
    """Get all services in the cluster with their status"""
    try:
        # List all services in the cluster
        list_response = ecs_client.list_services(
            cluster=cluster_name,
            maxResults=100
        )
        
        service_arns = list_response.get('serviceArns', [])
        
        if not service_arns:
            return []
        
        # Describe all services to get detailed information
        describe_response = ecs_client.describe_services(
            cluster=cluster_name,
            services=service_arns
        )
        
        services = []
        for service in describe_response.get('services', []):
            service_info = {
                'name': service.get('serviceName'),
                'status': service.get('status'),
                'desired_count': service.get('desiredCount', 0),
                'running_count': service.get('runningCount', 0),
                'pending_count': service.get('pendingCount', 0),
                'task_definition': service.get('taskDefinition', '').split('/')[-1],
                'created_at': service.get('createdAt').isoformat() if service.get('createdAt') else None,
                'load_balancers': []
            }
            
            # Get load balancer info if attached
            for lb in service.get('loadBalancers', []):
                service_info['load_balancers'].append({
                    'target_group_arn': lb.get('targetGroupArn'),
                    'container_name': lb.get('containerName'),
                    'container_port': lb.get('containerPort')
                })
            
            services.append(service_info)
        
        return services
    
    except ecs_client.exceptions.ClusterNotFoundException:
        raise ValueError(f"Cluster '{cluster_name}' not found")
    except Exception as e:
        print(f"Error getting cluster services: {str(e)}")
        raise

def lambda_handler(event, context):
    """
    Handle GET /status request
    
    Query params:
    - cluster_name: Name of the ECS cluster
    
    Returns cluster status including all services and ALB information
    """
    try:
        # Get cluster name from query parameters
        query_params = event.get('queryStringParameters') or {}
        cluster_name = query_params.get('cluster_name')
        
        if not cluster_name:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'cluster_name query parameter is required'
                })
            }
        
        # Get cluster information
        try:
            cluster_response = ecs_client.describe_clusters(
                clusters=[cluster_name]
            )
            
            clusters = cluster_response.get('clusters', [])
            if not clusters:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': f"Cluster '{cluster_name}' not found"
                    })
                }
            
            cluster = clusters[0]
            
        except Exception as e:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f"Cluster '{cluster_name}' not found: {str(e)}"
                })
            }
        
        # Get all services in the cluster
        services = get_cluster_services(cluster_name)
        
        # Get ALB information
        alb = get_alb_for_cluster(cluster_name)
        
        # Build response
        response_data = {
            'cluster': {
                'name': cluster.get('clusterName'),
                'arn': cluster.get('clusterArn'),
                'status': cluster.get('status'),
                'registered_container_instances': cluster.get('registeredContainerInstancesCount', 0),
                'running_tasks': cluster.get('runningTasksCount', 0),
                'pending_tasks': cluster.get('pendingTasksCount', 0),
                'active_services': cluster.get('activeServicesCount', 0)
            },
            'services': services,
            'load_balancer': alb,
            'summary': {
                'total_services': len(services),
                'services_running': sum(1 for s in services if s['running_count'] > 0),
                'services_stopped': sum(1 for s in services if s['desired_count'] == 0),
                'total_desired_tasks': sum(s['desired_count'] for s in services),
                'total_running_tasks': sum(s['running_count'] for s in services),
                'total_pending_tasks': sum(s['pending_count'] for s in services)
            }
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data, default=str)
        }
    
    except ValueError as e:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
    
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
