#!/bin/bash

# Load Testing Script for MayDay API
# Tests API scalability and autoscaling behavior

set -e

# Configuration
API_URL="${API_URL:-http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com}"
DURATION="${DURATION:-60}"  # Duration in seconds
CONCURRENT_USERS="${CONCURRENT_USERS:-500}"
REQUESTS_PER_USER="${REQUESTS_PER_USER:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "=================================="
    echo "$1"
    echo "=================================="
    echo ""
}

# Check for required tools
check_dependencies() {
    print_info "Checking dependencies..."
    
    local missing=0
    
    if ! command -v ab &> /dev/null; then
        print_warning "Apache Bench (ab) not found. Install: brew install httpd (macOS) or apt install apache2-utils (Linux)"
        missing=1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl not found. Please install curl."
        missing=1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq not found (optional). Install: brew install jq"
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
    
    print_success "All required dependencies found"
}

# Test API health
test_health() {
    print_header "Testing API Health"
    
    print_info "Checking ${API_URL}/health"
    
    if curl -sf "${API_URL}/health" > /dev/null; then
        print_success "API is healthy"
        return 0
    else
        print_error "API health check failed"
        return 1
    fi
}

# Load test health endpoint
load_test_health() {
    print_header "Load Testing Health Endpoint"
    
    print_info "Running load test: ${CONCURRENT_USERS} concurrent users, ${REQUESTS_PER_USER} requests each"
    
    ab -n $((CONCURRENT_USERS * REQUESTS_PER_USER)) \
       -c ${CONCURRENT_USERS} \
       -g health_results.tsv \
       "${API_URL}/health"
    
    print_success "Health endpoint load test completed"
}

# Load test with authentication
load_test_with_auth() {
    print_header "Load Testing with Authentication"
    
    # First, register and login to get a token
    print_info "Registering test user..."
    
    local timestamp=$(date +%s)
    local test_email="loadtest_${timestamp}@example.com"
    local test_password="LoadTest123!"
    
    # Register
    register_response=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${test_email}\",
            \"password\": \"${test_password}\",
            \"name\": \"Load Test User\",
            \"phone\": \"+1234567890\"
        }")
    
    if echo "$register_response" | grep -q "error" 2>/dev/null; then
        print_warning "Registration might have failed, trying login anyway"
    else
        print_success "User registered successfully"
    fi
    
    # Login
    print_info "Logging in..."
    
    login_response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${test_email}\",
            \"password\": \"${test_password}\"
        }")
    
    token=$(echo "$login_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        print_error "Failed to get authentication token"
        print_info "Response: $login_response"
        return 1
    fi
    
    print_success "Successfully authenticated"
    
    # Test authenticated endpoints
    print_info "Testing authenticated endpoints..."
    
    # Save token to file for ab to use
    echo "Authorization: Bearer ${token}" > /tmp/auth_headers.txt
    
    # Load test events endpoint
    print_info "Load testing /events endpoint"
    ab -n $((CONCURRENT_USERS * REQUESTS_PER_USER / 2)) \
       -c $((CONCURRENT_USERS / 2)) \
       -H "Authorization: Bearer ${token}" \
       "${API_URL}/events"
    
    print_success "Authenticated endpoint load test completed"
    
    rm -f /tmp/auth_headers.txt
}

# Ramp-up load test (gradual increase)
ramp_up_load_test() {
    print_header "Ramp-Up Load Test"
    
    print_info "Gradually increasing load to test autoscaling..."
    
    local levels=(10 25 50 100 200)
    
    for level in "${levels[@]}"; do
        print_info "Testing with ${level} concurrent users..."
        
        ab -n $((level * 20)) \
           -c ${level} \
           -t 30 \
           "${API_URL}/health" > /dev/null 2>&1
        
        print_success "Completed ${level} concurrent users"
        sleep 5
    done
    
    print_success "Ramp-up test completed"
}

# Spike test (sudden traffic spike)
spike_test() {
    print_header "Spike Test"
    
    print_info "Testing sudden traffic spike..."
    
    # Normal load
    print_info "Starting with normal load (10 users)..."
    ab -n 200 -c 10 -t 10 "${API_URL}/health" > /dev/null 2>&1
    
    sleep 2
    
    # Spike
    print_info "SPIKE: 500 concurrent users!"
    ab -n 5000 -c 500 -t 30 "${API_URL}/health"
    
    sleep 2
    
    # Back to normal
    print_info "Back to normal load (10 users)..."
    ab -n 200 -c 10 -t 10 "${API_URL}/health" > /dev/null 2>&1
    
    print_success "Spike test completed"
}

# Stress test (sustained high load)
stress_test() {
    print_header "Stress Test"
    
    print_info "Running sustained high load for ${DURATION} seconds..."
    
    ab -n 100000 \
       -c 200 \
       -t ${DURATION} \
       "${API_URL}/health"
    
    print_success "Stress test completed"
}

# Monitor ECS service during load test
monitor_ecs() {
    print_header "ECS Service Monitoring"
    
    print_info "To monitor ECS service scaling, run in another terminal:"
    echo ""
    echo "  watch -n 2 'aws ecs describe-services \\"
    echo "    --cluster mayday-cluster \\"
    echo "    --services mayday-cluster-api-service \\"
    echo "    --query \"services[0].[desiredCount,runningCount]\" \\"
    echo "    --output table'"
    echo ""
}

# Main menu
show_menu() {
    print_header "MayDay API Load Testing"
    
    echo "API URL: ${API_URL}"
    echo "Concurrent Users: ${CONCURRENT_USERS}"
    echo "Requests per User: ${REQUESTS_PER_USER}"
    echo "Duration: ${DURATION}s"
    echo ""
    echo "Select test type:"
    echo "  1) Health Check"
    echo "  2) Basic Load Test (Health Endpoint)"
    echo "  3) Load Test with Authentication"
    echo "  4) Ramp-Up Test (Gradual Load Increase)"
    echo "  5) Spike Test (Sudden Traffic Spike)"
    echo "  6) Stress Test (Sustained High Load)"
    echo "  7) Full Test Suite (All Tests)"
    echo "  8) Show ECS Monitoring Command"
    echo "  9) Exit"
    echo ""
}

# Main execution
main() {
    check_dependencies
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Enter choice [1-9]: " choice
            
            case $choice in
                1)
                    test_health
                    ;;
                2)
                    load_test_health
                    ;;
                3)
                    load_test_with_auth
                    ;;
                4)
                    ramp_up_load_test
                    ;;
                5)
                    spike_test
                    ;;
                6)
                    stress_test
                    ;;
                7)
                    print_header "Running Full Test Suite"
                    test_health && \
                    load_test_health && \
                    ramp_up_load_test && \
                    spike_test && \
                    stress_test
                    print_success "Full test suite completed"
                    ;;
                8)
                    monitor_ecs
                    ;;
                9)
                    print_info "Exiting..."
                    exit 0
                    ;;
                *)
                    print_error "Invalid option"
                    ;;
            esac
            
            echo ""
            read -p "Press Enter to continue..."
        done
    else
        # Command line mode
        case "$1" in
            health)
                test_health
                ;;
            load)
                load_test_health
                ;;
            auth)
                load_test_with_auth
                ;;
            ramp)
                ramp_up_load_test
                ;;
            spike)
                spike_test
                ;;
            stress)
                stress_test
                ;;
            full)
                test_health && \
                load_test_health && \
                ramp_up_load_test && \
                spike_test && \
                stress_test
                ;;
            *)
                echo "Usage: $0 [health|load|auth|ramp|spike|stress|full]"
                exit 1
                ;;
        esac
    fi
}

main "$@"
