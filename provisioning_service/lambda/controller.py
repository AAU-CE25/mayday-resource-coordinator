import boto3
import os

dynamodb = boto3.resource('dynamodb')
ecs = boto3.client('ecs')

USERS_TABLE = os.environ['USERS_TABLE']
VOLUMES_TABLE = os.environ['VOLUMES_TABLE']
CLUSTER_NAME = os.environ['ECS_CLUSTER']
TASK_DEFINITION = os.environ['TASK_DEFINITION']
SUBNETS = os.environ['SUBNETS'].split(',')

def lambda_handler(event, context):
    user_id = event['user_id']
    
    # 1. Authorize user
    user_table = dynamodb.Table(USERS_TABLE)
    user = user_table.get_item(Key={'UserID': user_id}).get('Item')
    if not user or not user.get('canStartSession'):
        return {"statusCode": 403, "body": "Unauthorized"}

    # 2. Get user volume info
    volumes_table = dynamodb.Table(VOLUMES_TABLE)
    volume_info = volumes_table.get_item(Key={'UserID': user_id}).get('Item')
    
    # 3. Start ECS task
    response = ecs.run_task(
        cluster=CLUSTER_NAME,
        taskDefinition=TASK_DEFINITION,
        launchType='FARGATE',
        overrides={
            'containerOverrides': [
                {'name': 'api', 'environment': [{'name':'USER_ID','value':user_id}]},
                {'name': 'db', 'environment': [{'name':'VOLUME_PATH','value':volume_info.get('VolumePath','/data')}]}
            ]
        },
        networkConfiguration={
            'awsvpcConfiguration': {
                'subnets': SUBNETS,
                'assignPublicIp': 'ENABLED'
            }
        }
    )
    return {"statusCode": 200, "body": f"Session started: {response}"}
