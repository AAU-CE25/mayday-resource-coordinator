// Configuration
const CONFIG = {
    API_ENDPOINT: 'https://jp3emi1qi8.execute-api.eu-central-1.amazonaws.com',
    DEFAULT_CLUSTER: 'mayday-cluster',
    REFRESH_INTERVAL: 30000 // 30 seconds
};

// Session management
const SESSION_KEY = 'mayday_admin_token';
const CLUSTER_KEY = 'mayday_cluster_name';
let refreshInterval = null;

function getAuthToken() {
    return sessionStorage.getItem(SESSION_KEY);
}

function setAuthToken(token) {
    sessionStorage.setItem(SESSION_KEY, token);
}

function clearAuthToken() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(CLUSTER_KEY);
}

function getClusterName() {
    return sessionStorage.getItem(CLUSTER_KEY) || CONFIG.DEFAULT_CLUSTER;
}

function setClusterName(clusterName) {
    sessionStorage.setItem(CLUSTER_KEY, clusterName);
}

function isAuthenticated() {
    return !!getAuthToken();
}

// Login function
async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    
    errorDiv.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINT}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const data = await response.json();
        
        if (data.token) {
            setAuthToken(data.token);
            if (data.clusterName) {
                setClusterName(data.clusterName);
            }
            showDashboard();
            await loadClusterStatus();
            startAutoRefresh();
        } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Logout function
function logout() {
    stopAutoRefresh();
    clearAuthToken();
    showLogin();
}

// UI control functions
function showLogin() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('serviceContainer').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('serviceContainer').style.display = 'block';
}

// Auto-refresh functionality
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(loadClusterStatus, CONFIG.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Load cluster status from API
async function loadClusterStatus() {
    const clusterName = getClusterName();
    const token = getAuthToken();
    
    if (!token) {
        logout();
        return;
    }
    
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINT}/status?cluster_name=${clusterName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch cluster status');
        }
        
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error loading cluster status:', error);
        showError('Failed to load cluster status: ' + error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Update dashboard with cluster data
function updateDashboard(data) {
    // Update subtitle
    document.getElementById('clusterSubtitle').textContent = `Cluster: ${data.cluster.name} - ${data.cluster.status}`;
    
    // Update summary
    document.getElementById('totalServices').textContent = data.summary.total_services;
    document.getElementById('runningServices').textContent = data.summary.services_running;
    document.getElementById('runningTasks').textContent = data.summary.total_running_tasks;
    document.getElementById('clusterStatus').textContent = data.cluster.status;
    
    // Find services
    const frontendService = data.services.find(s => s.name.includes('frontend-service'));
    const suvService = data.services.find(s => s.name.includes('suv-ui-service'));
    const apiService = data.services.find(s => s.name.includes('api-service'));
    const dbService = data.services.find(s => s.name.includes('db-service'));
    
    // Update frontend service
    if (frontendService) {
        updateServiceCard('frontend', frontendService);
        if (frontendService.desired_count > 0) {
            updateServiceLink('frontendLink', data.load_balancer.dns_name, '/dashboard');
        } else {
            document.getElementById('frontendLink').style.display = 'none';
        }
    }
    
    // Update SUV service
    if (suvService) {
        updateServiceCard('suv', suvService);
        if (suvService.desired_count > 0) {
            updateServiceLink('suvLink', data.load_balancer.dns_name, '/suv');
        } else {
            document.getElementById('suvLink').style.display = 'none';
        }
    }
    
    // Update API service
    if (apiService) {
        updateServiceCard('api', apiService);
    }
    
    // Update database service
    if (dbService) {
        updateServiceCard('db', dbService);
    }
    
    // Update load balancer info
    document.getElementById('albDns').textContent = data.load_balancer.dns_name;
    document.getElementById('albType').textContent = data.load_balancer.type.toUpperCase();
    document.getElementById('albState').textContent = data.load_balancer.state.toUpperCase();
    
    // Show all sections
    document.getElementById('clusterSummary').style.display = 'grid';
    document.getElementById('servicesGrid').style.display = 'grid';
    document.getElementById('loadBalancerInfo').style.display = 'block';
}

// Update individual service card
function updateServiceCard(serviceId, serviceData) {
    document.getElementById(`${serviceId}Running`).textContent = serviceData.running_count;
    document.getElementById(`${serviceId}Desired`).textContent = serviceData.desired_count;
    
    const statusBadge = document.getElementById(`${serviceId}Status`);
    if (serviceData.desired_count === 0) {
        statusBadge.textContent = 'Turned Off';
        statusBadge.className = 'status-badge inactive';
    } else if (serviceData.status === 'ACTIVE' && serviceData.running_count === serviceData.desired_count) {
        statusBadge.textContent = 'Active';
        statusBadge.className = 'status-badge active';
    } else {
        statusBadge.textContent = 'Degraded';
        statusBadge.className = 'status-badge inactive';
    }
    
    // Show/hide control buttons based on desired count
    const controlsDiv = document.getElementById(`${serviceId}Controls`);
    const onBtn = document.getElementById(`${serviceId}OnBtn`);
    const offBtn = document.getElementById(`${serviceId}OffBtn`);
    
    if (controlsDiv && onBtn && offBtn) {
        controlsDiv.style.display = 'flex';
        
        if (serviceData.desired_count === 0) {
            onBtn.style.display = 'block';
            offBtn.style.display = 'none';
        } else {
            onBtn.style.display = 'none';
            offBtn.style.display = 'block';
        }
    }
}

// Update service link
function updateServiceLink(linkId, albDns, path) {
    const link = document.getElementById(linkId);
    link.href = `http://${albDns}${path}`;
    link.style.display = 'inline-block';
}

// Service management functions
async function toggleService(serviceNameSuffix, desiredCount) {
    const clusterName = getClusterName();
    const serviceName = `${clusterName}-${serviceNameSuffix}`;
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');

    const token = getAuthToken();
    if (!token) {
        showError('Not authenticated. Please login again.');
        logout();
        return;
    }

    // Show loading state
    loadingDiv.style.display = 'block';
    resultDiv.style.display = 'none';

    // Disable all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    try {
        const response = await fetch(`${CONFIG.API_ENDPOINT}/scale`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                cluster_name: clusterName,
                service_name: serviceName,
                desired_count: desiredCount
            })
        });

        if (response.status === 401 || response.status === 403) {
            showError('Session expired. Please login again.');
            logout();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Request failed'}`);
        }

        const data = await response.json();

        if (data.status === 'success') {
            showSuccess(data, desiredCount);
            // Reload cluster status after a short delay
            setTimeout(() => loadClusterStatus(), 2000);
        } else {
            showError(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Toggle service error:', error);
        showError(`Request failed: ${error.message}`);
    } finally {
        // Hide loading and enable buttons
        loadingDiv.style.display = 'none';
        buttons.forEach(btn => btn.disabled = false);
    }
}

// UI display functions
function showSuccess(data, desiredCount) {
    const resultDiv = document.getElementById('result');
    const action = desiredCount === 1 ? 'ON' : 'OFF';
    
    resultDiv.className = 'result success';
    resultDiv.innerHTML = `
        <div class="result-title">✅ Service Turned ${action} Successfully</div>
        <div class="result-item">
            <span class="result-label">Service:</span>
            <span class="result-value">${data.service}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Desired Count:</span>
            <span class="result-value">${data.desired_count}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Running Count:</span>
            <span class="result-value">${data.running_count}</span>
        </div>
    `;
    resultDiv.style.display = 'block';
}

function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'result error';
    resultDiv.innerHTML = `
        <div class="result-title">❌ Error</div>
        <p>${message}</p>
    `;
    resultDiv.style.display = 'block';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('MayDay Monitoring Dashboard loaded');
    console.log('API Endpoint:', CONFIG.API_ENDPOINT);
    
    // Check if already authenticated
    if (isAuthenticated()) {
        showDashboard();
        loadClusterStatus();
        startAutoRefresh();
    } else {
        showLogin();
    }
    
    // Setup login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
});
