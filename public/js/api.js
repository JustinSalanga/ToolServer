// API Configuration
const API_BASE_URL = 'http://localhost:8085/api';

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Get stored token
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Set token
function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

// Remove token
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Get stored user
function getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

// Set user
function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Handle unauthorized - redirect to login
        if (response.status === 401) {
            removeToken();
            window.location.hash = '#login';
            throw new Error('Session expired. Please login again.');
        }

        // Try to parse JSON response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, get text
            const text = await response.text();
            data = { error: text || 'An error occurred' };
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'An error occurred');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const AuthAPI = {
    async register(name, email, password, confirm_password) {
        return apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, confirm_password }),
            skipAuth: true
        });
    },

    async login(email, password) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            skipAuth: true
        });

        if (data.token) {
            setToken(data.token);
            setUser(data.user);
        }

        return data;
    },

    async logout() {
        removeToken();
    }
};

// Users API
const UsersAPI = {
    async getAll() {
        return apiRequest('/auth/');
    },

    async getById(id) {
        return apiRequest(`/auth/${id}`);
    },

    async update(id, name, email) {
        return apiRequest(`/auth/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, email })
        });
    },

    async delete(id) {
        return apiRequest(`/auth/${id}`, {
            method: 'DELETE'
        });
    },

    async toggleBlock(id, blocked) {
        return apiRequest(`/auth/${id}/block`, {
            method: 'PATCH',
            body: JSON.stringify({ blocked })
        });
    }
};

// IPs API
const IPsAPI = {
    async getAll() {
        return apiRequest('/ips/');
    },

    async getById(id) {
        return apiRequest(`/ips/${id}`);
    },

    async getByUser(userId) {
        return apiRequest(`/ips/user/${userId}`);
    },

    async getUserByIP(ip) {
        return apiRequest(`/ips/lookup/${encodeURIComponent(ip)}`);
    },

    async create(userId, ip) {
        return apiRequest('/ips/', {
            method: 'POST',
            body: JSON.stringify({ userId, ip })
        });
    },

    async update(id, userId, ip) {
        return apiRequest(`/ips/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ userId, ip })
        });
    },

    async delete(id) {
        return apiRequest(`/ips/${id}`, {
            method: 'DELETE'
        });
    }
};

// Settings API
const SettingsAPI = {
    async getAll() {
        return apiRequest('/settings/');
    },

    async getById(id) {
        return apiRequest(`/settings/${id}`);
    },

    async getByKey(key) {
        return apiRequest(`/settings/key/${key}`);
    },

    async create(key, value) {
        return apiRequest('/settings/', {
            method: 'POST',
            body: JSON.stringify({ key, value })
        });
    },

    async update(id, key, value) {
        return apiRequest(`/settings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ key, value })
        });
    },

    async delete(id) {
        return apiRequest(`/settings/${id}`, {
            method: 'DELETE'
        });
    }
};

// GPT Model API
const GPTAPI = {
    async getAvailableModels() {
        return apiRequest('/gpt/models');
    },

    async getSelectedModel() {
        return apiRequest('/gpt/selected');
    },

    async setSelectedModel(modelId) {
        return apiRequest('/gpt/selected', {
            method: 'POST',
            body: JSON.stringify({ modelId })
        });
    },

    async getApiKey() {
        return apiRequest('/gpt/apikey');
    },

    async saveApiKey(apiKey) {
        return apiRequest('/gpt/apikey', {
            method: 'POST',
            body: JSON.stringify({ apiKey })
        });
    }
};

// User Config API
const ConfigAPI = {
    async getAllConfigs() {
        return apiRequest('/config/all');
    },

    async getConfig(userEmail) {
        return apiRequest(`/config/${encodeURIComponent(userEmail)}`);
    },

    async getPrompt(userEmail) {
        return apiRequest(`/config/prompt/${encodeURIComponent(userEmail)}`);
    },

    async getResume(userEmail) {
        return apiRequest(`/config/resume/${encodeURIComponent(userEmail)}`);
    },

    async getTemplate(userEmail) {
        return apiRequest(`/config/template/${encodeURIComponent(userEmail)}`);
    },

    async getFolder(userEmail) {
        return apiRequest(`/config/folder/${encodeURIComponent(userEmail)}`);
    }
};
