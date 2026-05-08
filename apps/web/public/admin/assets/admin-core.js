// Admin Core Utility
const API_BASE_URL = 'https://api.trampai.com.br';
const adminToken = localStorage.getItem('trampai_admin_token');
const adminUser = JSON.parse(localStorage.getItem('trampai_admin_user') || '{}');

// Auth Guard
if (!adminToken || adminUser.role !== 'admin') {
    if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Common Functions
function logout() {
    localStorage.removeItem('trampai_admin_token');
    localStorage.removeItem('trampai_admin_user');
    window.location.href = 'login.html';
}

async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401) {
        logout();
        return;
    }

    return response.json();
}

// UI Helpers
function showToast(message, type = 'success') {
    // Simple toast implementation can be added here
    alert(message);
}

// Export for use in HTML files
window.adminCore = {
    apiFetch,
    logout,
    user: adminUser,
    token: adminToken
};
