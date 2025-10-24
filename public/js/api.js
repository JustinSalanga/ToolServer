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
        const response = await fetch(`http://${window.location.hostname}:8085/api${endpoint}`, {
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

// Admin Auth API
const AdminAuthAPI = {
    async register(name, email, password, confirm_password) {
        return apiRequest('/admin/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, confirm_password }),
            skipAuth: true
        });
    },

    async login(email, password) {
        const data = await apiRequest('/admin/login', {
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

    async verify() {
        return apiRequest('/admin/verify');
    },

    async logout() {
        removeToken();
    }
};

// Legacy Auth API (for backward compatibility)
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

    async update(id, name, email, registration_ip) {
        return apiRequest(`/auth/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, email, registration_ip })
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

// IPs API (for IP lookup only)
const IPsAPI = {
    async getUserByIP(ip) {
        return apiRequest(`/ips/lookup/${encodeURIComponent(ip)}`);
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
        return apiRequest('/config/all', { skipAuth: true });
    },

    async getConfig(userEmail) {
        return apiRequest(`/config/${encodeURIComponent(userEmail)}`, { skipAuth: true });
    },

    async getPrompt(userEmail) {
        return apiRequest(`/config/prompt/${encodeURIComponent(userEmail)}`, { skipAuth: true });
    },

    async getResume(userEmail) {
        return apiRequest(`/config/resume/${encodeURIComponent(userEmail)}`, { skipAuth: true });
    },

    async getTemplate(userEmail) {
        return apiRequest(`/config/template/${encodeURIComponent(userEmail)}`, { skipAuth: true });
    },

    async getFolder(userEmail) {
        return apiRequest(`/config/folder/${encodeURIComponent(userEmail)}`, { skipAuth: true });
    }
};

// Jobs API
const JobsAPI = {
    async getAll(date = null, page = 1, limit = 20, search = null, orderDirection = 'ASC') {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (search) params.append('search', search);
        params.append('page', page);
        params.append('limit', limit);
        params.append('orderDirection', orderDirection);
        
        const url = `/jobs/?${params.toString()}`;
        return apiRequest(url, { skipAuth: true });
    },

    async getById(id) {
        return apiRequest(`/jobs/${id}`, { skipAuth: true });
    },

    async create(id, title, company, tech, url, description) {
        return apiRequest('/jobs/', {
            method: 'POST',
            body: JSON.stringify({ id, title, company, tech, url, description }),
            skipAuth: true
        });
    },

    async update(id, title, company, date, tech, url, description) {
        return apiRequest(`/jobs/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, company, date, tech, url, description }),
            skipAuth: true
        });
    },

    async delete(id) {
        return apiRequest(`/jobs/${id}`, {
            method: 'DELETE',
            skipAuth: true
        });
    }
};