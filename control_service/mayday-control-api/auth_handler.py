import boto3
import json
import hashlib
import secrets
import os
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('USERS_TABLE', 'mayday-admin-users')
table = dynamodb.Table(table_name)

def generate_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_credentials(username, password):
    """Verify username and password against DynamoDB"""
    try:
        response = table.get_item(Key={'username': username})
        
        if 'Item' not in response:
            return None
        
        user = response['Item']
        password_hash = hash_password(password)
        
        if user.get('password_hash') == password_hash:
            return user
        return None
    except Exception as e:
        print(f"Error verifying credentials: {str(e)}")
        return None

def store_token(username, token):
    """Store auth token in DynamoDB with expiration"""
    try:
        expiration = datetime.utcnow() + timedelta(hours=24)
        
        table.update_item(
            Key={'username': username},
            UpdateExpression='SET auth_token = :token, token_expiration = :exp',
            ExpressionAttributeValues={
                ':token': token,
                ':exp': expiration.isoformat()
            }
        )
        return True
    except Exception as e:
        print(f"Error storing token: {str(e)}")
        return False

def verify_token(token):
    """Verify if token is valid and not expired"""
    try:
        response = table.scan(
            FilterExpression='auth_token = :token',
            ExpressionAttributeValues={':token': token}
        )
        
        if not response.get('Items'):
            return False
        
        user = response['Items'][0]
        expiration = datetime.fromisoformat(user.get('token_expiration', ''))
        
        if datetime.utcnow() > expiration:
            return False
        
        return True
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return False

def lambda_handler(event, context):
    """
    Handle authentication requests and authorization
    
    Two modes:
    1. Login: POST /login with body: {"username": "user", "password": "pass"}
    2. Authorizer: Invoked by API Gateway to verify tokens (type is REQUEST)
    """
    try:
        request_context = event.get('requestContext', {})
        
        # Check if this is an authorizer invocation (has 'type' field set to 'REQUEST')
        if event.get('type') == 'REQUEST':
            # API Gateway Authorizer mode
            headers = event.get('headers', {})
            auth_header = headers.get('authorization', headers.get('Authorization', ''))
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return {
                    'isAuthorized': False
                }
            
            token = auth_header.replace('Bearer ', '').strip()
            
            if verify_token(token):
                return {
                    'isAuthorized': True
                }
            else:
                return {
                    'isAuthorized': False
                }
        
        # Login endpoint mode
        http_method = request_context.get('http', {}).get('method')
        path = request_context.get('http', {}).get('path', '')
        
        if http_method == 'POST' and path == '/login':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username')
            password = body.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Username and password required'})
                }
            
            user = verify_credentials(username, password)
            if user:
                token = generate_token()
                
                if store_token(username, token):
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({
                            'token': token,
                            'username': username,
                            'clusterName': user.get('cluster_name', '')
                        })
                    }
                else:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Failed to generate token'})
                    }
            else:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Invalid credentials'})
                }
        
        # Unexpected request
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid request'})
        }
    
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
