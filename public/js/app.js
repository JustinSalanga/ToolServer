// Global state
let currentPage = 'login';
let usersData = [];
let gptModels = [];
let selectedGPTModel = null;
let configsData = [];
let jobsData = [];
let isNavigating = false; // Flag to prevent infinite loops

// ========== CUSTOM MODAL FUNCTIONS ==========

// Show Alert Modal
function showAlert(message, title = 'Alert') {
    return new Promise((resolve) => {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertTitle');
        const messageEl = document.getElementById('alertMessage');
        const okBtn = document.getElementById('alertOkBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.add('active');

        const handleOk = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            resolve();
        };

        okBtn.addEventListener('click', handleOk);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleOk();
            }
        });
    });
}

// Show Confirm Modal
function showConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.add('active');

        const handleOk = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);

        // Close on backdrop click (treat as cancel)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
});

// Check authentication
function checkAuth() {
    const token = getToken();
    const user = getUser();
    const currentHash = window.location.hash.substring(1);
    const publicPages = ['configs', 'jobs'];

    if (token && user) {
        showDashboard(user);
    } else if (publicPages.includes(currentHash)) {
        // User is on a public page - show it without authentication
        showPublicView();
    } else {
        // Not logged in and not on a public page - redirect to login page
        showLoginView();
        // Clear any hash that might be in the URL
        window.location.hash = '#login';
    }
}

// Show public view (for non-authenticated users on public pages)
function showPublicView() {
    // Hide protected links
    document.querySelectorAll('.protected-link').forEach(link => {
        link.style.display = 'none';
    });

    // Show public links
    document.querySelectorAll('.public-link').forEach(link => {
        link.style.display = 'flex';
    });

    // Show login link
    document.getElementById('loginNavLink').style.display = 'flex';

    // Hide user info
    document.getElementById('userInfo').style.display = 'none';

    // Clear any stored data
    usersData = [];
    configsData = [];
    jobsData = [];

    // Show the current page based on hash
    const currentHash = window.location.hash.substring(1);
    if (currentHash && ['configs', 'jobs'].includes(currentHash)) {
        showPage(currentHash, false);
    } else if (!currentHash) {
        // No hash specified, default to jobs page for public access
        window.location.hash = '#jobs';
        showPage('jobs', false);
    }
}

// Show login view
function showLoginView() {
    // Hide protected links
    document.querySelectorAll('.protected-link').forEach(link => {
        link.style.display = 'none';
    });

    // Show public links
    document.querySelectorAll('.public-link').forEach(link => {
        link.style.display = 'flex';
    });

    // Show login link
    document.getElementById('loginNavLink').style.display = 'flex';

    // Hide user info
    document.getElementById('userInfo').style.display = 'none';

    // Clear any stored data
    usersData = [];
    configsData = [];
    jobsData = [];

    // Set hash to login page and show it
    window.location.hash = '#login';
    showPage('login', false);
}

// Show dashboard
function showDashboard(user) {
    // Hide login link
    document.getElementById('loginNavLink').style.display = 'none';

    // Show protected links
    document.querySelectorAll('.protected-link').forEach(link => {
        link.style.display = 'flex';
    });

    // Show public links
    document.querySelectorAll('.public-link').forEach(link => {
        link.style.display = 'flex';
    });

    // Show user info
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = user.name;

    // Check if user is on a specific page, otherwise default to users
    const currentHash = window.location.hash.substring(1);
    if (currentHash && ['users', 'gpt', 'configs', 'jobs'].includes(currentHash)) {
        showPage(currentHash, false);
    } else {
        // Set hash to users page and show it
        window.location.hash = '#users';
        showPage('users', false);
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');

            // Check if page requires authentication
            const protectedPages = ['users', 'gpt'];
            if (!getToken() && protectedPages.includes(page)) {
                showAlert('Please login first', 'Authentication Required');
                window.location.hash = '#login';
                return;
            }

            // Update hash and show page
            window.location.hash = `#${page}`;
        });
    });

    // Handle browser back/forward and direct hash navigation
    window.addEventListener('hashchange', handleHashChange);

    // Check initial hash on load
    handleHashChange();
}

// Handle hash changes in URL
function handleHashChange() {
    if (isNavigating) return; // Prevent infinite loops
    
    const hash = window.location.hash.substring(1); // Remove the '#'
    const token = getToken();
    const user = getUser();
    const protectedPages = ['users', 'gpt'];
    const publicPages = ['configs', 'jobs'];

    if (hash && hash !== 'login') {
        // If there's a hash for a protected page, check authentication
        if (!token && protectedPages.includes(hash)) {
            showLoginView();
            return;
        } else if (!token && publicPages.includes(hash)) {
            // Allow access to public pages without authentication
            showPage(hash, false); // Don't update hash to prevent loop
            return;
        } else if (token && user) {
            // Authenticated user - show the requested page
            showPage(hash, false); // Don't update hash to prevent loop
            return;
        }
    } else if (hash === 'login') {
        // Show login page
        showPage('login', false); // Don't update hash to prevent loop
    } else if (!hash) {
        // No hash specified - default behavior based on authentication
        isNavigating = true;
        if (token && user) {
            window.location.hash = '#users';
        } else {
            window.location.hash = '#login';
        }
        isNavigating = false;
    }
}

// Show page
function showPage(pageName, updateHash = true) {
    // Update hash in address bar only if requested
    if (updateHash) {
        window.location.hash = `#${pageName}`;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`page-${pageName}`).classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

    currentPage = pageName;

    // Load data for the page
    if (pageName === 'users') loadUsers();
    if (pageName === 'gpt') loadGPTModels();
    if (pageName === 'configs') loadConfigs();
    if (pageName === 'jobs') {
        initializeDateFilter();
        // Load jobs with today's date as default
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;
        loadJobs(isoDate);
    }
}

// ========== LOGIN/REGISTER ==========

function showLogin() {
    document.querySelector('#registerBox').style.display = 'none';
    document.querySelector('.login-box:first-child').style.display = 'block';
}

function showRegister() {
    document.querySelector('.login-box:first-child').style.display = 'none';
    document.querySelector('#registerBox').style.display = 'block';
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const data = await AuthAPI.login(email, password);
        showDashboard(data.user);
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';

        // Don't reload page for role-based access denied
        if (error.message.includes('Admin privileges required')) {
            return;
        }

        // Reload page after 2 seconds to retry for other errors
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm_password = document.getElementById('registerConfirmPassword').value;
    const errorDiv = document.getElementById('registerError');

    try {
        await AuthAPI.register(name, email, password, confirm_password);
        await showAlert('Registration successful! Please login.', 'Success');
        showLogin();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

function logout() {
    AuthAPI.logout();
    // Clear hash and show login view
    window.location.hash = '#login';
    showLoginView();
}

// ========== USERS MANAGEMENT ==========

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading users...</td></tr>';

    try {
        const data = await UsersAPI.getAll();
        usersData = data.users || [];
        renderUsers(usersData);
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        tbody.innerHTML = `<tr><td colspan="7" class="loading" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No users found</td></tr>';
        return;
    }

    // Get current logged-in user
    const currentUser = getUser();

    tbody.innerHTML = users.map(user => {
        // Check if this is the currently logged-in user
        const isCurrentUser = currentUser && (user.id === currentUser.id || user.email === currentUser.email);

        return `
        <tr>
            <td>${user.id}</td>
            <td>${user.name} ${isCurrentUser ? '<span class="badge badge-success" style="font-size: 10px;">You</span>' : ''}</td>
            <td>${user.email}</td>
            <td>${user.registration_ip || '<em>Not set</em>'}</td>
            <td>
                <span class="badge ${user.blocked === 1 ? 'badge-success' : 'badge-danger'}">
                    ${user.blocked === 1 ? 'Active' : 'Blocked'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <div class="btn-group">
                    <button onclick="editUser(${user.id})" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="toggleUserBlock(${user.id}, ${user.blocked === 1 ? 0 : 1})"
                            class="btn btn-warning btn-sm"
                            ${isCurrentUser ? 'disabled title="You cannot block yourself"' : ''}>
                        ${user.blocked === 1 ? 'Block' : 'Unblock'}
                    </button>
                    <button onclick="deleteUser(${user.id})"
                            class="btn btn-danger btn-sm"
                            ${isCurrentUser ? 'disabled title="You cannot delete yourself"' : ''}>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function filterUsers() {
    const searchText = document.getElementById('userSearch').value.toLowerCase();
    const filtered = usersData.filter(user =>
        user.name.toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText)
    );
    renderUsers(filtered);
}

function showAddUserModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Add New User</h2>
        <form onsubmit="addUser(event)">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="newUserName" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="newUserEmail" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="newUserPassword" required>
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" id="newUserConfirmPassword" required>
            </div>
            <button type="submit" class="btn btn-primary">Add User</button>
        </form>
    `;
    openModal();
}

async function addUser(event) {
    event.preventDefault();

    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const confirm_password = document.getElementById('newUserConfirmPassword').value;

    try {
        await AuthAPI.register(name, email, password, confirm_password);
        closeModal();
        loadUsers();
        await showAlert('User added successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

function editUser(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit User</h2>
        <form onsubmit="updateUser(event, ${id})">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="editUserName" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="editUserEmail" value="${user.email}" required>
            </div>
            <div class="form-group">
                <label>Registration IP</label>
                <input type="text" id="editUserIP" value="${user.registration_ip || ''}" placeholder="192.168.1.100">
                <small>Leave empty to allow login from any IP</small>
            </div>
            <button type="submit" class="btn btn-primary">Update User</button>
        </form>
    `;
    openModal();
}

async function updateUser(event, id) {
    event.preventDefault();

    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const registration_ip = document.getElementById('editUserIP').value.trim() || null;

    try {
        await UsersAPI.update(id, name, email, registration_ip);
        closeModal();
        loadUsers();
        await showAlert('User updated successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function toggleUserBlock(id, blocked) {
    // Prevent blocking yourself
    const currentUser = getUser();
    const targetUser = usersData.find(u => u.id === id);

    if (currentUser && targetUser && (currentUser.id === targetUser.id || currentUser.email === targetUser.email)) {
        await showAlert('You cannot block or unblock yourself!', 'Action Not Allowed');
        return;
    }

    const confirmed = await showConfirm(
        `Are you sure you want to ${blocked === 0 ? 'block' : 'unblock'} this user?`,
        'Confirm Action'
    );

    if (!confirmed) {
        return;
    }

    try {
        await UsersAPI.toggleBlock(id, blocked);
        loadUsers();
        await showAlert(`User ${blocked === 0 ? 'blocked' : 'unblocked'} successfully!`, 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function deleteUser(id) {
    // Prevent deleting yourself
    const currentUser = getUser();
    const targetUser = usersData.find(u => u.id === id);

    if (currentUser && targetUser && (currentUser.id === targetUser.id || currentUser.email === targetUser.email)) {
        await showAlert('You cannot delete yourself!', 'Action Not Allowed');
        return;
    }

    const confirmed = await showConfirm(
        'Are you sure you want to delete this user?',
        'Delete User'
    );

    if (!confirmed) {
        return;
    }

    try {
        await UsersAPI.delete(id);
        loadUsers();
        await showAlert('User deleted successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}


// ========== MODAL ==========

function openModal() {
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// ========== GPT MODEL MANAGEMENT ==========

async function loadGPTModels() {
    const container = document.getElementById('gptModelsContainer');
    container.innerHTML = '<div class="loading-text">Loading available models...</div>';

    try {
        // Load available models, current selection, and API key
        const [modelsData, selectedData, apiKeyData] = await Promise.all([
            GPTAPI.getAvailableModels(),
            GPTAPI.getSelectedModel(),
            GPTAPI.getApiKey()
        ]);

        gptModels = modelsData.models || [];
        const currentModel = selectedData.selectedModel || 'gpt-3.5-turbo';
        selectedGPTModel = currentModel;

        // Update current model display
        const currentModelInfo = gptModels.find(m => m.id === currentModel);
        document.getElementById('currentModelName').textContent =
            currentModelInfo ? currentModelInfo.name : currentModel;

        // Update API key display
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKeyStatus = document.getElementById('apiKeyStatus');
        if (apiKeyData.isSet) {
            apiKeyInput.value = apiKeyData.apiKey;
            apiKeyStatus.textContent = '✅ API key is configured';
            apiKeyStatus.style.color = 'green';
        } else {
            apiKeyInput.value = '';
            apiKeyStatus.textContent = '⚠️ No API key configured';
            apiKeyStatus.style.color = 'orange';
        }

        // Render model cards
        renderGPTModels();
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        container.innerHTML = `<div class="loading-text" style="color: red;">Error: ${error.message}</div>`;
    }
}

function renderGPTModels() {
    const container = document.getElementById('gptModelsContainer');

    if (gptModels.length === 0) {
        container.innerHTML = '<div class="loading-text">No models available</div>';
        return;
    }

    container.innerHTML = gptModels.map(model => `
        <div class="gpt-model-card ${model.id === selectedGPTModel ? 'selected' : ''}"
             onclick="selectGPTModel('${model.id}')">
            <h4>
                ${model.name}
                <span class="check-icon">✓</span>
            </h4>
            <span class="model-id">${model.id}</span>
            <p>${model.description}</p>
        </div>
    `).join('');
}

function selectGPTModel(modelId) {
    selectedGPTModel = modelId;
    renderGPTModels();

    // Show save button
    document.getElementById('saveModelSection').style.display = 'block';
}

async function saveSelectedModel() {
    if (!selectedGPTModel) {
        await showAlert('Please select a model first', 'No Model Selected');
        return;
    }

    try {
        const result = await GPTAPI.setSelectedModel(selectedGPTModel);

        // Update current model display
        const modelInfo = gptModels.find(m => m.id === selectedGPTModel);
        document.getElementById('currentModelName').textContent =
            modelInfo ? modelInfo.name : selectedGPTModel;

        // Hide save button
        document.getElementById('saveModelSection').style.display = 'none';

        await showAlert(result.message || 'Model selection saved successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        apiKeyStatus.textContent = '❌ Please enter an API key';
        apiKeyStatus.style.color = 'red';
        return;
    }

    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        apiKeyStatus.textContent = '❌ Invalid API key format (must start with sk- and be at least 20 characters)';
        apiKeyStatus.style.color = 'red';
        return;
    }

    try {
        const result = await GPTAPI.saveApiKey(apiKey);
        apiKeyStatus.textContent = '✅ ' + (result.message || 'API key saved successfully!');
        apiKeyStatus.style.color = 'green';

        // Reload to show masked key
        setTimeout(() => {
            loadGPTModels();
        }, 1000);
    } catch (error) {
        apiKeyStatus.textContent = '❌ Error: ' + error.message;
        apiKeyStatus.style.color = 'red';
    }
}

function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleBtn = document.getElementById('toggleVisibilityBtn');

    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        apiKeyInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// ========== USER CONFIGS MANAGEMENT ==========

async function loadConfigs() {
    const tbody = document.getElementById('configsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading configurations...</td></tr>';

    try {
        const data = await ConfigAPI.getAllConfigs();
        configsData = data.configs || [];
        renderConfigs(configsData);
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        tbody.innerHTML = `<tr><td colspan="7" class="loading" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function renderConfigs(configs) {
    const tbody = document.getElementById('configsTableBody');

    if (configs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No configurations found</td></tr>';
        return;
    }

    tbody.innerHTML = configs.map(config => `
        <tr>
            <td><strong>${config.user_email}</strong></td>
            <td>
                <span class="badge ${config.prompt ? 'badge-success' : 'badge-secondary'}">
                    ${config.prompt ? '✓ Yes' : '✗ No'}
                </span>
            </td>
            <td>
                <span class="badge ${config.resume ? 'badge-success' : 'badge-secondary'}">
                    ${config.resume ? '✓ Yes' : '✗ No'}
                </span>
            </td>
            <td>${config.template_path || '<em>Not set</em>'}</td>
            <td>${config.folder_path || '<em>Not set</em>'}</td>
            <td>${new Date(config.updated_at).toLocaleString()}</td>
            <td>
                <div class="btn-group">
                    <button onclick="viewConfig('${config.user_email}')" class="btn btn-secondary btn-sm">👁️ View</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterConfigs() {
    const searchText = document.getElementById('configSearch').value.toLowerCase();
    const filtered = configsData.filter(config =>
        config.user_email.toLowerCase().includes(searchText)
    );
    renderConfigs(filtered);
}

async function viewConfig(userEmail) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '<div class="loading-text">Loading configuration...</div>';
    openModal();

    try {
        const data = await ConfigAPI.getConfig(userEmail);
        const config = data.config;

        modalBody.innerHTML = `
            <h2>Configuration for ${userEmail}</h2>
            <div class="config-details">
                <div class="config-section">
                    <h3>📝 Prompt</h3>
                    <div class="config-content">
                        ${config.prompt ? `<pre>${config.prompt}</pre>` : '<em>Not set</em>'}
                    </div>
                </div>

                <div class="config-section">
                    <h3>📄 Resume</h3>
                    <div class="config-content">
                        ${config.resume ? `<pre>${config.resume.substring(0, 500)}${config.resume.length > 500 ? '...' : ''}</pre>` : '<em>Not set</em>'}
                    </div>
                </div>

                <div class="config-section">
                    <h3>📋 Template Path</h3>
                    <div class="config-content">
                        ${config.template_path || '<em>Not set</em>'}
                    </div>
                </div>

                <div class="config-section">
                    <h3>📁 Folder Path</h3>
                    <div class="config-content">
                        ${config.folder_path || '<em>Not set</em>'}
                    </div>
                </div>

                <div class="config-section">
                    <h3>🕒 Timestamps</h3>
                    <div class="config-content">
                        <p><strong>Created:</strong> ${new Date(config.created_at).toLocaleString()}</p>
                        <p><strong>Updated:</strong> ${new Date(config.updated_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <button onclick="closeModal()" class="btn btn-secondary" style="margin-top: 20px;">Close</button>
        `;
    } catch (error) {
        modalBody.innerHTML = `
            <h2>Error</h2>
            <p style="color: red;">Failed to load configuration: ${error.message}</p>
            <button onclick="closeModal()" class="btn">Close</button>
        `;
    }
}

// ========== JOBS MANAGEMENT ==========

// Pagination state
let jobsCurrentPage = 1;
let pageSize = 20;
let totalPages = 1;
let totalJobs = 0;
let currentDateFilter = null;

async function loadJobs(date = null, page = 1, limit = 20) {
    const tbody = document.getElementById('jobsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading jobs...</td></tr>';

    try {
        const data = await JobsAPI.getAll(date, page, limit);
        jobsData = data.jobs || [];
        jobsCurrentPage = data.pagination.page;
        totalPages = data.pagination.totalPages;
        totalJobs = data.pagination.total;
        currentDateFilter = date;
        
        renderJobs(jobsData);
        updatePaginationControls();
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        tbody.innerHTML = `<tr><td colspan="8" class="loading" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function initializeDateFilter() {
    const dateSelect = document.getElementById('jobDateFilter');
    const today = new Date();
    
    // Clear existing options except "All Dates"
    dateSelect.innerHTML = '<option value="">All Dates</option>';
    
    // Generate options for the last 30 days
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Use local date for both display and value to ensure consistency
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${month}.${day}`;
        const isoDate = `${year}-${month}-${day}`;
        
        const option = document.createElement('option');
        option.value = isoDate;
        option.textContent = dateString;
        
        // Set today as default
        if (i === 0) {
            option.selected = true;
        }
        
        dateSelect.appendChild(option);
    }
}

function renderJobs(jobs) {
    const tbody = document.getElementById('jobsTableBody');

    if (jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No jobs found</td></tr>';
        return;
    }

    tbody.innerHTML = jobs.map(job => `
        <tr>
            <td>${job.id}</td>
            <td><strong>${job.title}</strong></td>
            <td>${job.company}</td>
            <td>${job.tech || '<em>Not specified</em>'}</td>
            <td>
                ${job.url ? `<a href="${job.url}" target="_blank" class="btn btn-secondary btn-sm">🔗 View</a>` : '<em>No URL</em>'}
            </td>
            <td>
                ${job.description ? 
                    `<span title="${job.description}">${job.description.length > 50 ? job.description.substring(0, 50) + '...' : job.description}</span>` : 
                    '<em>No description</em>'
                }
            </td>
            <td>${new Date(job.created_at).toLocaleDateString()}</td>
            <td>
                <div class="btn-group">
                    <button onclick="editJob(${job.id})" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="deleteJob(${job.id})" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterJobs() {
    const searchText = document.getElementById('jobSearch').value.toLowerCase();
    const dateFilter = document.getElementById('jobDateFilter').value;
    
    let filtered = jobsData;
    
    // Apply text search filter
    if (searchText) {
        filtered = filtered.filter(job =>
            job.title.toLowerCase().includes(searchText) ||
            job.company.toLowerCase().includes(searchText) ||
            (job.tech && job.tech.toLowerCase().includes(searchText)) ||
            (job.description && job.description.toLowerCase().includes(searchText))
        );
    }
    
    // Apply date filter
    if (dateFilter) {
        filtered = filtered.filter(job => {
            const jobDate = new Date(job.created_at).toISOString().split('T')[0];
            return jobDate === dateFilter;
        });
    }
    
    renderJobs(filtered);
}

function filterJobsByDate() {
    const dateFilter = document.getElementById('jobDateFilter').value;
    jobsCurrentPage = 1; // Reset to first page when filtering
    if (dateFilter) {
        loadJobs(dateFilter, 1, pageSize);
    } else {
        loadJobs(null, 1, pageSize);
    }
}

function clearDateFilter() {
    const dateSelect = document.getElementById('jobDateFilter');
    dateSelect.value = '';
    jobsCurrentPage = 1; // Reset to first page when clearing filter
    loadJobs(null, 1, pageSize);
}

// Pagination functions
function updatePaginationControls() {
    const paginationContainer = document.getElementById('jobsPagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (totalJobs === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Update pagination info
    const startItem = (jobsCurrentPage - 1) * pageSize + 1;
    const endItem = Math.min(jobsCurrentPage * pageSize, totalJobs);
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalJobs}`;
    
    // Update page numbers
    pageNumbers.innerHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, jobsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('span');
        pageBtn.className = `page-number ${i === jobsCurrentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageBtn);
    }
    
    // Update button states
    document.getElementById('firstPage').disabled = jobsCurrentPage === 1;
    document.getElementById('prevPage').disabled = jobsCurrentPage === 1;
    document.getElementById('nextPage').disabled = jobsCurrentPage === totalPages;
    document.getElementById('lastPage').disabled = jobsCurrentPage === totalPages;
}

function goToPage(page) {
    if (page < 1 || page > totalPages || page === jobsCurrentPage) return;
    loadJobs(currentDateFilter, page, pageSize);
}

function goToPreviousPage() {
    if (jobsCurrentPage > 1) {
        goToPage(jobsCurrentPage - 1);
    }
}

function goToNextPage() {
    if (jobsCurrentPage < totalPages) {
        goToPage(jobsCurrentPage + 1);
    }
}

function goToLastPage() {
    goToPage(totalPages);
}

function changePageSize() {
    const newPageSize = parseInt(document.getElementById('pageSize').value);
    pageSize = newPageSize;
    jobsCurrentPage = 1; // Reset to first page
    loadJobs(currentDateFilter, 1, pageSize);
}

function showAddJobModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Add New Job</h2>
        <form onsubmit="addJob(event)">
            <div class="form-group">
                <label>Job ID *</label>
                <input type="number" id="newJobId" required placeholder="123" min="1">
            </div>
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="newJobTitle" required placeholder="Senior Developer">
            </div>
            <div class="form-group">
                <label>Company *</label>
                <input type="text" id="newJobCompany" required placeholder="Tech Corp">
            </div>
            <div class="form-group">
                <label>Tech Stack</label>
                <input type="text" id="newJobTech" placeholder="React, Node.js, PostgreSQL">
            </div>
            <div class="form-group">
                <label>URL</label>
                <input type="url" id="newJobUrl" placeholder="https://example.com/job/123">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="newJobDescription" rows="4" placeholder="Job description..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Add Job</button>
        </form>
    `;
    openModal();
}

async function addJob(event) {
    event.preventDefault();

    const id = parseInt(document.getElementById('newJobId').value);
    const title = document.getElementById('newJobTitle').value;
    const company = document.getElementById('newJobCompany').value;
    const tech = document.getElementById('newJobTech').value;
    const url = document.getElementById('newJobUrl').value;
    const description = document.getElementById('newJobDescription').value;

    try {
        await JobsAPI.create(id, title, company, tech, url, description);
        closeModal();
        loadJobs();
        await showAlert('Job added successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

function editJob(id) {
    const job = jobsData.find(j => j.id === id);
    if (!job) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit Job</h2>
        <form onsubmit="updateJob(event, ${id})">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="editJobTitle" value="${job.title}" required>
            </div>
            <div class="form-group">
                <label>Company *</label>
                <input type="text" id="editJobCompany" value="${job.company}" required>
            </div>
            <div class="form-group">
                <label>Tech Stack</label>
                <input type="text" id="editJobTech" value="${job.tech || ''}" placeholder="React, Node.js, PostgreSQL">
            </div>
            <div class="form-group">
                <label>URL</label>
                <input type="url" id="editJobUrl" value="${job.url || ''}" placeholder="https://example.com/job/123">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="editJobDescription" rows="4" placeholder="Job description...">${job.description || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Update Job</button>
        </form>
    `;
    openModal();
}

async function updateJob(event, id) {
    event.preventDefault();

    const title = document.getElementById('editJobTitle').value;
    const company = document.getElementById('editJobCompany').value;
    const tech = document.getElementById('editJobTech').value;
    const url = document.getElementById('editJobUrl').value;
    const description = document.getElementById('editJobDescription').value;

    try {
        await JobsAPI.update(id, title, company, tech, url, description);
        closeModal();
        loadJobs();
        await showAlert('Job updated successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function deleteJob(id) {
    const confirmed = await showConfirm(
        'Are you sure you want to delete this job?',
        'Delete Job'
    );

    if (!confirmed) {
        return;
    }

    try {
        await JobsAPI.delete(id);
        loadJobs();
        await showAlert('Job deleted successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

// ========== EXCEL EXPORT ==========

function exportJobsToExcel() {
    try {
        // Get the currently displayed jobs (filtered data)
        const searchText = document.getElementById('jobSearch').value.toLowerCase();
        const dateFilter = document.getElementById('jobDateFilter').value;
        
        let jobsToExport = jobsData;
        
        // Apply the same filters as the UI
        if (searchText) {
            jobsToExport = jobsToExport.filter(job =>
                job.title.toLowerCase().includes(searchText) ||
                job.company.toLowerCase().includes(searchText) ||
                (job.tech && job.tech.toLowerCase().includes(searchText)) ||
                (job.description && job.description.toLowerCase().includes(searchText))
            );
        }
        
        if (dateFilter) {
            jobsToExport = jobsToExport.filter(job => {
                const jobDate = new Date(job.created_at).toISOString().split('T')[0];
                return jobDate === dateFilter;
            });
        }
        
        if (jobsToExport.length === 0) {
            showAlert('No jobs to export. Please add some jobs first.', 'No Data');
            return;
        }
        
        // Prepare data for Excel
        const excelData = jobsToExport.map(job => ({
            'Job ID': job.id,
            'Title': job.title,
            'Company': job.company,
            'Tech Stack': job.tech || '',
            'URL': job.url || '',
            'Description': job.description || '',
            'Created At': new Date(job.created_at).toLocaleString(),
            'Updated At': new Date(job.updated_at).toLocaleString()
        }));
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
            { wch: 8 },   // Job ID
            { wch: 30 },  // Title
            { wch: 20 },  // Company
            { wch: 25 },  // Tech Stack
            { wch: 40 },  // URL
            { wch: 50 },  // Description
            { wch: 20 },  // Created At
            { wch: 20 }   // Updated At
        ];
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Jobs');
        
        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `jobs_export_${currentDate}.xlsx`;
        
        // Save the file
        XLSX.writeFile(wb, filename);
        
        showAlert(`Successfully exported ${jobsToExport.length} jobs to ${filename}`, 'Export Complete');
        
    } catch (error) {
        console.error('Excel export error:', error);
        showAlert('Error exporting to Excel: ' + error.message, 'Export Failed');
    }
}
