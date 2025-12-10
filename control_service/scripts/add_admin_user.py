#!/usr/bin/env python3
"""
Script to add admin users to DynamoDB

Usage:
    python add_admin_user.py <username> <password>
"""

import boto3
import hashlib
import sys

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def add_user(username, password, table_name='mayday-control-api-admin-users'):
    """Add user to DynamoDB"""
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(table_name)
    
    try:
        password_hash = hash_password(password)
        
        table.put_item(
            Item={
                'username': username,
                'password_hash': password_hash,
                'created_at': str(boto3.dynamodb.conditions.Attr),
            }
        )
        
        print(f"✅ User '{username}' added successfully")
        return True
    except Exception as e:
        print(f"❌ Error adding user: {str(e)}")
        return False

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python add_admin_user.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters long")
        sys.exit(1)
    
    add_user(username, password)
