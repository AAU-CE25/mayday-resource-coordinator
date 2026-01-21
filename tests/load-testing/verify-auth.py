#!/usr/bin/env python3
"""
Quick script to verify authentication is working in the API
"""

import requests
import json
import sys
import time

API_URL = "http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com"

def test_authentication():
    print("=== Testing MayDay API Authentication ===\n")
    
    # Test 1: Health check (no auth required)
    print("1. Testing health endpoint (no auth)...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
        return False
    
    # Test 2: Register new user
    print("2. Registering new user...")
    timestamp = int(time.time() * 1000)
    test_user = {
        "email": f"test_{timestamp}@example.com",
        "password": "TestPassword123!",
        "name": "Test User",
        "phone": "+1234567890"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Email: {test_user['email']}")
        if response.status_code in [200, 201]:
            print(f"   ✓ User registered successfully\n")
        else:
            print(f"   Response: {response.text}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
    
    # Test 3: Login
    print("3. Logging in...")
    token = None
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"]
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                token = data.get("access_token") or data.get("token")
                if token:
                    print(f"   ✓ Token obtained: {token[:20]}...\n")
                else:
                    print(f"   ✗ No token in response")
                    print(f"   Response data: {data}\n")
                    return False
            except json.JSONDecodeError:
                print(f"   ✗ Failed to parse JSON response\n")
                return False
        else:
            print(f"   ✗ Login failed: {response.text}\n")
            return False
            
    except Exception as e:
        print(f"   Error: {e}\n")
        return False
    
    # Test 4: Access protected endpoint with token
    print("4. Testing protected endpoint WITH token...")
    try:
        response = requests.get(
            f"{API_URL}/events",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✓ Successfully accessed protected endpoint\n")
        else:
            print(f"   Response: {response.text}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
    
    # Test 5: Access protected endpoint without token
    print("5. Testing protected endpoint WITHOUT token...")
    try:
        response = requests.get(
            f"{API_URL}/events",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code in [401, 403]:
            print(f"   ✓ Correctly rejected unauthorized request\n")
        else:
            print(f"   ⚠ Expected 401/403 but got {response.status_code}")
            print(f"   Response: {response.text}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
    
    print("=== Authentication Test Complete ===")
    return True

if __name__ == "__main__":
    success = test_authentication()
    sys.exit(0 if success else 1)
