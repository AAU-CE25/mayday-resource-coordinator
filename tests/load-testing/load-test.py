#!/usr/bin/env python3
"""
Advanced Load Testing Script for MayDay API using Locust
Simulates realistic user behavior and tests autoscaling
"""

import random
import time
from locust import HttpUser, task, between, events
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MayDayUser(HttpUser):
    """Simulates a MayDay user with various behaviors"""
    
    # Wait between 1-5 seconds between tasks
    wait_time = between(1, 5)
    
    def on_start(self):
        """Called when a user starts - registers and logs in"""
        timestamp = int(time.time() * 1000)
        self.email = f"loadtest_{timestamp}_{random.randint(1000, 9999)}@example.com"
        self.password = "LoadTest123!"
        self.token = None
        
        # Register user
        self.register()
        
        # Login to get token
        self.login()
    
    def register(self):
        """Register a new user"""
        try:
            response = self.client.post(
                "/auth/register",
                json={
                    "email": self.email,
                    "password": self.password,
                    "name": f"Load Test User {random.randint(1, 1000)}",
                    "phone": f"+1{random.randint(1000000000, 9999999999)}"
                },
                name="/auth/register",
                catch_response=True
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"Registered user: {self.email}")
                response.success()
            else:
                logger.warning(f"Registration failed for {self.email}: {response.status_code}")
                response.failure(f"Registration failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Registration error: {e}")
    
    def login(self):
        """Login and store authentication token"""
        try:
            response = self.client.post(
                "/auth/login",
                json={
                    "email": self.email,
                    "password": self.password
                },
                name="/auth/login",
                catch_response=True
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.token = data.get("access_token") or data.get("token")
                    if self.token:
                        logger.info(f"Logged in user: {self.email}")
                        response.success()
                    else:
                        logger.error(f"No token in response for {self.email}")
                        response.failure("No token in response")
                except Exception as e:
                    logger.error(f"Failed to parse login response: {e}")
                    response.failure(f"Parse error: {e}")
            else:
                logger.error(f"Login failed for {self.email}: {response.status_code}")
                response.failure(f"Login failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Login error: {e}")
    
    def get_headers(self):
        """Get headers with authentication token"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def health_check(self):
        """Check API health - most common operation"""
        self.client.get("/health", name="/health")
    
    @task(5)
    def view_events(self):
        """View events list"""
        if not self.token:
            logger.warning(f"No token available for {self.email}, skipping authenticated request")
            return
            
        self.client.get(
            "/events",
            headers=self.get_headers(),
            name="/events"
        )
    
    @task(3)
    def view_volunteers(self):
        """View volunteers list"""
        if not self.token:
            return
            
        self.client.get(
            "/volunteers",
            headers=self.get_headers(),
            name="/volunteers"
        )
    
    @task(3)
    def view_resources(self):
        """View resources list"""
        if not self.token:
            return
            
        self.client.get(
            "/resources",
            headers=self.get_headers(),
            name="/resources"
        )
    
    @task(2)
    def create_event(self):
        """Create a new event"""
        event_data = {
            "name": f"Load Test Event {random.randint(1, 10000)}",
            "description": "This is a load testing event",
            "location": f"Location {random.randint(1, 100)}",
            "event_type": random.choice(["flood", "fire", "earthquake", "other"]),
            "status": "active"
        }
        
        self.client.post(
            "/events",
            json=event_data,
            headers=self.get_headers(),
            name="/events (POST)"
        )
    
    @task(2)
    def register_volunteer(self):
        """Register a volunteer"""
        if not self.token:
            return
            
        volunteer_data = {
            "name": f"Volunteer {random.randint(1, 10000)}",
            "email": f"volunteer_{random.randint(1, 10000)}@example.com",
            "phone": f"+1{random.randint(1000000000, 9999999999)}",
            "skills": random.sample(["medical", "rescue", "logistics", "communication"], k=2),
            "availability": "available"
        }
        
        self.client.post(
            "/volunteers",
            json=volunteer_data,
            headers=self.get_headers(),
            name="/volunteers (POST)"
        )
    
    @task(2)
    def add_resource(self):
        """Add a resource"""
        if not self.token:
            return
            
        resource_data = {
            "name": f"Resource {random.randint(1, 10000)}",
            "type": random.choice(["equipment", "supply", "vehicle", "other"]),
            "quantity": random.randint(1, 100),
            "location": f"Location {random.randint(1, 100)}",
            "status": "available"
        }
        
        self.client.post(
            "/resources",
            json=resource_data,
            headers=self.get_headers(),
            name="/resources (POST)"
        )
    
    @task(1)
    def search_events(self):
        """Search events with filters"""
        if not self.token:
            return
            
        params = {
            "status": random.choice(["active", "completed"]),
            "event_type": random.choice(["flood", "fire", "earthquake"])
        }
        
        self.client.get(
            "/events",
            params=params,
            headers=self.get_headers(),
            name="/events (search)"
        )


class AdminUser(HttpUser):
    """Simulates an admin user with heavier operations"""
    
    wait_time = between(2, 8)
    weight = 1  # Less admin users than regular users
    
    def on_start(self):
        """Admin login"""
        # Use admin credentials from environment or config
        import os
        self.email = os.getenv("ADMIN_EMAIL", "admin@mayday.com")
        self.password = os.getenv("ADMIN_PASSWORD", "admin_password")
        self.token = None
        logger.info(f"Admin user logging in with: {self.email}")
        self.login()
    
    def login(self):
        """Login as admin"""
        try:
            response = self.client.post(
                "/auth/login",
                json={
                    "email": self.email,
                    "password": self.password
                },
                name="/auth/login (admin)",
                catch_response=True
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.token = data.get("access_token") or data.get("token")
                    if self.token:
                        logger.info(f"Admin logged in: {self.email}")
                        response.success()
                    else:
                        response.failure("No token in response")
                except Exception as e:
                    logger.error(f"Failed to parse admin login response: {e}")
                    response.failure(f"Parse error: {e}")
            else:
                logger.error(f"Admin login failed: {response.status_code}")
                response.failure(f"Login failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Admin login error: {e}")
    
    def get_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(5)
    def view_all_events(self):
        """View all events"""
        if not self.token:
            return
            
        self.client.get(
            "/events",
            headers=self.get_headers(),
            name="/events (admin)"
        )
    
    @task(3)
    def view_statistics(self):
        """View system statistics"""
        if not self.token:
            return
            
        self.client.get(
            "/stats",
            headers=self.get_headers(),
            name="/stats"
        )
    
    @task(2)
    def manage_users(self):
        """Manage users"""
        if not self.token:
            return
            
        self.client.get(
            "/users",
            headers=self.get_headers(),
            name="/users"
        )


@events.init_command_line_parser.add_listener
def _(parser):
    """Add custom command line options"""
    parser.add_argument("--api-url", type=str, default="http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com",
                       help="API URL to test")


if __name__ == "__main__":
    import os
    import sys
    
    print("""
    MayDay API Load Testing with Locust
    ====================================
    
    Installation:
        pip install locust
    
    Usage:
        # Web UI mode (recommended)
        locust -f load-test.py --host http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com
        # Then open http://localhost:8089
        
        # Headless mode
        locust -f load-test.py --host http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com \\
               --users 100 --spawn-rate 10 --run-time 5m --headless
        
        # Ramp-up test
        locust -f load-test.py --host http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com \\
               --users 500 --spawn-rate 5 --run-time 10m --headless
    
    Test Scenarios:
        - Regular users: Browsing, creating events, registering volunteers
        - Admin users: Managing system, viewing statistics
        - Mixed workload: Simulates realistic usage patterns
    """)
