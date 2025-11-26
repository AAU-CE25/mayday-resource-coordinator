import json
import boto3
import os
from datetime import datetime
import secrets

# Initialize AWS clients
ecs_client = boto3.client('ecs')
ec2_client = boto3.client('ec2')
elbv2_client = boto3.client('elbv2')
dynamodb = boto3.resource('dynamodb')

# Environment variables
ECS_CLUSTER = os.environ.get('ECS_CLUSTER_NAME')
ECR_REGISTRY = os.environ.get('ECR_REGISTRY')  # e.g., 123456.dkr.ecr.us-east-1.amazonaws.com
SUBNET_IDS = os.environ.get('SUBNET_IDS', '').split(',')
SECURITY_GROUP_ID = os.environ.get('SECURITY_GROUP_ID')
USERS_TABLE = os.environ.get('DYNAMODB_USERS_TABLE', 'mayday-users')
SESSIONS_TABLE = os.environ.get('DYNAMODB_SESSIONS_TABLE', 'mayday-sessions')

def lambda_handler(event, context):
    """
    Lambda handler for provisioning on-demand ECS sessions
    """
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        version = body.get('version', 'latest')  # Allow specifying version
        action = body.get('action', 'start')  # start or stop
        
        if not user_id:
            return response(400, {'error': 'user_id is required'})
        
        # Check user authorization
        if not is_user_authorized(user_id):
            return response(403, {'error': 'User not authorized'})
        
        if action == 'start':
            return start_session(user_id, version)
        elif action == 'stop':
            session_id = body.get('session_id')
            return stop_session(user_id, session_id)
        else:
            return response(400, {'error': 'Invalid action. Use "start" or "stop"'})
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return response(500, {'error': str(e)})


def is_user_authorized(user_id):
    """Check if user is authorized in DynamoDB"""
    try:
        table = dynamodb.Table(USERS_TABLE)
        response = table.get_item(Key={'user_id': user_id})
        user = response.get('Item')
        return user and user.get('authorized', False)
    except Exception as e:
        print(f"⚠️  Error checking authorization: {e}")
        return False


def start_session(user_id, version='latest'):
    """Start a new ECS Fargate session for the user"""
    
    # Generate unique session ID
    session_id = f"session-{user_id}-{secrets.token_hex(4)}"
    timestamp = datetime.utcnow().isoformat()
    
    # Build task definition with ECR images
    task_definition = {
        'family': f'mayday-{session_id}',
        'networkMode': 'awsvpc',
        'requiresCompatibilities': ['FARGATE'],
        'cpu': '1024',  # 1 vCPU
        'memory': '2048',  # 2 GB
        'executionRoleArn': os.environ.get('ECS_EXECUTION_ROLE_ARN'),
        'taskRoleArn': os.environ.get('ECS_TASK_ROLE_ARN'),
        'containerDefinitions': [
            {
                'name': 'api_service',
                'image': f'{ECR_REGISTRY}/api_service:{version}',
                'essential': True,
                'portMappings': [
                    {'containerPort': 8000, 'protocol': 'tcp'}
                ],
                'environment': [
                    {'name': 'POSTGRES_HOST', 'value': 'localhost'},
                    {'name': 'POSTGRES_DB', 'value': f'mayday_db_{user_id}'},
                    {'name': 'POSTGRES_USER', 'value': 'mayday_user'},
                    {'name': 'SESSION_ID', 'value': session_id}
                ],
                'logConfiguration': {
                    'logDriver': 'awslogs',
                    'options': {
                        'awslogs-group': f'/ecs/mayday-sessions',
                        'awslogs-region': os.environ.get('AWS_REGION', 'us-east-1'),
                        'awslogs-stream-prefix': session_id
                    }
                }
            },
            {
                'name': 'postgres',
                'image': 'postgres:18',
                'essential': True,
                'environment': [
                    {'name': 'POSTGRES_DB', 'value': f'mayday_db_{user_id}'},
                    {'name': 'POSTGRES_USER', 'value': 'mayday_user'},
                    {'name': 'POSTGRES_PASSWORD', 'value': secrets.token_urlsafe(16)}
                ],
                'mountPoints': [
                    {
                        'sourceVolume': 'user-data',
                        'containerPath': '/var/lib/postgresql/data'
                    }
                ]
            },
            {
                'name': 'frontend',
                'image': f'{ECR_REGISTRY}/frontend:{version}',
                'essential': False,
                'portMappings': [
                    {'containerPort': 3000, 'protocol': 'tcp'}
                ],
                'environment': [
                    {'name': 'NEXT_PUBLIC_API_URL', 'value': 'http://localhost:8000'}
                ]
            },
            {
                'name': 'suv_ui',
                'image': f'{ECR_REGISTRY}/suv_ui:{version}',
                'essential': False,
                'portMappings': [
                    {'containerPort': 3030, 'protocol': 'tcp'}
                ],
                'environment': [
                    {'name': 'NEXT_PUBLIC_API_URL', 'value': 'http://localhost:8000'}
                ]
            }
        ],
        'volumes': [
            {
                'name': 'user-data',
                'efsVolumeConfiguration': {
                    'fileSystemId': get_user_volume(user_id),
                    'transitEncryption': 'ENABLED'
                }
            }
        ]
    }
    
    # Register task definition
    task_def_response = ecs_client.register_task_definition(**task_definition)
    task_def_arn = task_def_response['taskDefinition']['taskDefinitionArn']
    
    # Run the task
    run_task_response = ecs_client.run_task(
        cluster=ECS_CLUSTER,
        taskDefinition=task_def_arn,
        launchType='FARGATE',
        networkConfiguration={
            'awsvpcConfiguration': {
                'subnets': SUBNET_IDS,
                'securityGroups': [SECURITY_GROUP_ID],
                'assignPublicIp': 'ENABLED'
            }
        },
        tags=[
            {'key': 'user_id', 'value': user_id},
            {'key': 'session_id', 'value': session_id},
            {'key': 'version', 'value': version}
        ]
    )
    
    task_arn = run_task_response['tasks'][0]['taskArn']
    
    # Wait for task to get network interface
    # In production, use EventBridge to handle this asynchronously
    import time
    time.sleep(10)
    
    # Get task details and public IP
    task_details = ecs_client.describe_tasks(
        cluster=ECS_CLUSTER,
        tasks=[task_arn]
    )
    
    # Extract network interface details
    task = task_details['tasks'][0]
    eni_id = None
    for attachment in task.get('attachments', []):
        if attachment['type'] == 'ElasticNetworkInterface':
            for detail in attachment['details']:
                if detail['name'] == 'networkInterfaceId':
                    eni_id = detail['value']
                    break
    
    public_ip = None
    if eni_id:
        eni_response = ec2_client.describe_network_interfaces(
            NetworkInterfaceIds=[eni_id]
        )
        public_ip = eni_response['NetworkInterfaces'][0].get('Association', {}).get('PublicIp')
    
    # Store session info in DynamoDB
    sessions_table = dynamodb.Table(SESSIONS_TABLE)
    sessions_table.put_item(
        Item={
            'session_id': session_id,
            'user_id': user_id,
            'task_arn': task_arn,
            'public_ip': public_ip,
            'version': version,
            'status': 'running',
            'created_at': timestamp,
            'api_url': f'http://{public_ip}:8000' if public_ip else None,
            'frontend_url': f'http://{public_ip}:3000' if public_ip else None,
            'suv_ui_url': f'http://{public_ip}:3030' if public_ip else None
        }
    )
    
    return response(200, {
        'session_id': session_id,
        'task_arn': task_arn,
        'status': 'starting',
        'urls': {
            'api': f'http://{public_ip}:8000' if public_ip else 'pending',
            'frontend': f'http://{public_ip}:3000' if public_ip else 'pending',
            'suv_ui': f'http://{public_ip}:3030' if public_ip else 'pending'
        },
        'version': version,
        'message': 'Session is starting. URLs will be available shortly.'
    })


def stop_session(user_id, session_id):
    """Stop an existing ECS session"""
    
    if not session_id:
        return response(400, {'error': 'session_id is required'})
    
    # Get session details from DynamoDB
    sessions_table = dynamodb.Table(SESSIONS_TABLE)
    session_response = sessions_table.get_item(Key={'session_id': session_id})
    session = session_response.get('Item')
    
    if not session:
        return response(404, {'error': 'Session not found'})
    
    if session['user_id'] != user_id:
        return response(403, {'error': 'Not authorized to stop this session'})
    
    # Stop the ECS task
    task_arn = session['task_arn']
    ecs_client.stop_task(
        cluster=ECS_CLUSTER,
        task=task_arn,
        reason='User requested session termination'
    )
    
    # Update DynamoDB
    sessions_table.update_item(
        Key={'session_id': session_id},
        UpdateExpression='SET #status = :status, stopped_at = :timestamp',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': 'stopped',
            ':timestamp': datetime.utcnow().isoformat()
        }
    )
    
    return response(200, {
        'session_id': session_id,
        'status': 'stopped',
        'message': 'Session has been terminated'
    })


def get_user_volume(user_id):
    """Get or create EFS volume for user's persistent data"""
    # In production, retrieve from DynamoDB volumes table
    # For now, return default EFS ID
    return os.environ.get('EFS_FILE_SYSTEM_ID', 'fs-xxxxxxxx')


def response(status_code, body):
    """Helper function to create API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }
