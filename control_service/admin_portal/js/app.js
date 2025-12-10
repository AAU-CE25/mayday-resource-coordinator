// Configuration
const CONFIG = {
    API_ENDPOINT: 'https://jp3emi1qi8.execute-api.eu-central-1.amazonaws.com/',
    DEFAULT_CLUSTER: 'mayday-cluster'
};

// Service management functions
async function toggleService(desiredCount) {
    const clusterName = document.getElementById('clusterName').value.trim();
    const serviceNameSuffix = document.getElementById('serviceName').value;
    const serviceName = `${clusterName}-${serviceNameSuffix}`;
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    if (!clusterName) {
        showError('Please enter a cluster name');
        return;
    }

    // Show loading state
    loadingDiv.style.display = 'block';
    resultDiv.style.display = 'none';

    // Disable buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    try {
        console.log('Sending request to:', CONFIG.API_ENDPOINT);
        console.log('Request body:', {
            cluster_name: clusterName,
            service_name: serviceName,
            desired_count: desiredCount
        });

        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cluster_name: clusterName,
                service_name: serviceName,
                desired_count: desiredCount
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText || 'Request failed'}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (data.status === 'success') {
            showSuccess(data, desiredCount);
        } else {
            showError(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Fetch error:', error);
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
            <span class="result-label">Cluster:</span>
            <span class="result-value">${data.cluster}</span>
        </div>
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
        <div class="result-item">
            <span class="result-label">Pending Count:</span>
            <span class="result-value">${data.pending_count}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Active Deployments:</span>
            <span class="result-value">${data.deployment_count}</span>
        </div>
        ${data.alb_url ? `
        <div class="result-item">
            <span class="result-label">Load Balancer:</span>
            <span class="result-value">
                <a href="${data.alb_url}" target="_blank" class="alb-link">
                    Open ALB ↗
                </a>
            </span>
        </div>
        ` : ''}
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
    console.log('MayDay Admin Portal loaded');
    console.log('API Endpoint:', CONFIG.API_ENDPOINT);
});
