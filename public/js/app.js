// Global state
let currentPage = 'login';
let usersData = [];
let ipsData = [];
let settingsData = [];
let gptModels = [];
let selectedGPTModel = null;
let configsData = [];

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

    if (token && user) {
        showDashboard(user);
    } else {
        // Not logged in - redirect to login page
        showLoginView();
        // Clear any hash that might be in the URL
        window.location.hash = '#login';
    }
}

// Show login view
function showLoginView() {
    // Hide protected links
    document.querySelectorAll('.protected-link').forEach(link => {
        link.style.display = 'none';
    });

    // Show login link
    document.getElementById('loginNavLink').style.display = 'flex';

    // Hide user info
    document.getElementById('userInfo').style.display = 'none';

    // Clear any stored data
    usersData = [];
    ipsData = [];
    settingsData = [];
    configsData = [];

    showPage('login');
}

// Show dashboard
function showDashboard(user) {
    // Hide login link
    document.getElementById('loginNavLink').style.display = 'none';

    // Show protected links
    document.querySelectorAll('.protected-link').forEach(link => {
        link.style.display = 'flex';
    });

    // Show user info
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = user.name;

    showPage('users');
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');

            if (!getToken() && page !== 'login') {
                showAlert('Please login first', 'Authentication Required');
                showLoginView();
                window.location.hash = '#login';
                return;
            }

            showPage(page);
        });
    });

    // Handle browser back/forward and direct hash navigation
    window.addEventListener('hashchange', handleHashChange);

    // Check initial hash on load
    handleHashChange();
}

// Handle hash changes in URL
function handleHashChange() {
    const hash = window.location.hash.substring(1); // Remove the '#'

    if (hash && hash !== 'login') {
        // If there's a hash for a protected page, check authentication
        if (!getToken()) {
            showLoginView();
            window.location.hash = '#login';
            return;
        }
    }
}

// Show page
function showPage(pageName) {
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
    if (pageName === 'ips') loadIPs();
    if (pageName === 'settings') loadSettings();
    if (pageName === 'gpt') loadGPTModels();
    if (pageName === 'configs') loadConfigs();
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

        // Reload page after 2 seconds to retry
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
    showLoginView();
}

// ========== USERS MANAGEMENT ==========

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>';

    try {
        const data = await UsersAPI.getAll();
        usersData = data.users || [];
        renderUsers(usersData);
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        tbody.innerHTML = `<tr><td colspan="6" class="loading" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
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
            <button type="submit" class="btn btn-primary">Update User</button>
        </form>
    `;
    openModal();
}

async function updateUser(event, id) {
    event.preventDefault();

    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;

    try {
        await UsersAPI.update(id, name, email);
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

// ========== IP MANAGEMENT ==========

async function loadIPs() {
    const tbody = document.getElementById('ipsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading IPs...</td></tr>';

    try {
        // Load both IPs and users data for display
        const [ipsResult, usersResult] = await Promise.all([
            IPsAPI.getAll(),
            usersData.length === 0 ? UsersAPI.getAll() : Promise.resolve({ users: usersData })
        ]);

        ipsData = ipsResult.ips || [];
        if (usersData.length === 0) {
            usersData = usersResult.users || [];
        }

        renderIPs(ipsData);
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        tbody.innerHTML = `<tr><td colspan="5" class="loading" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function renderIPs(ips) {
    const tbody = document.getElementById('ipsTableBody');

    if (ips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No IPs found</td></tr>';
        return;
    }

    tbody.innerHTML = ips.map(ip => {
        // Find user info for display
        const user = usersData.find(u => u.id == ip.userid);
        const userDisplay = user ? `${user.name} (${user.email})` : `User ID: ${ip.userid}`;

        return `
            <tr>
                <td>${ip.id}</td>
                <td>${userDisplay}</td>
                <td>${ip.ip}</td>
                <td>${new Date(ip.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group">
                        <button onclick="editIP(${ip.id})" class="btn btn-secondary btn-sm">Edit</button>
                        <button onclick="deleteIP(${ip.id})" class="btn btn-danger btn-sm">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterIPs() {
    const searchText = document.getElementById('ipSearch').value.toLowerCase();
    const filtered = ipsData.filter(ip => {
        const user = usersData.find(u => u.id == ip.userid);
        const userName = user ? user.name.toLowerCase() : '';
        const userEmail = user ? user.email.toLowerCase() : '';

        return userName.includes(searchText) ||
               userEmail.includes(searchText) ||
               ip.userid.toString().toLowerCase().includes(searchText) ||
               ip.ip.toLowerCase().includes(searchText);
    });
    renderIPs(filtered);
}

async function showAddIPModal() {
    const modalBody = document.getElementById('modalBody');

    // Show loading state
    modalBody.innerHTML = `
        <h2>Add New IP</h2>
        <div class="loading-text">Loading users...</div>
    `;
    openModal();

    try {
        // Fetch users if not already loaded
        if (usersData.length === 0) {
            const data = await UsersAPI.getAll();
            usersData = data.users || [];
        }

        // Generate users dropdown options
        const userOptions = usersData
            .map(user => `<option value="${user.id}">${user.name} (${user.email})</option>`)
            .join('');

        modalBody.innerHTML = `
            <h2>Add New IP</h2>
            <form onsubmit="addIP(event)">
                <div class="form-group">
                    <label>Select User</label>
                    <select id="newIPUserId" required>
                        <option value="">-- Select a user --</option>
                        ${userOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>IP Address</label>
                    <input type="text" id="newIPAddress" required placeholder="192.168.1.100">
                </div>
                <button type="submit" class="btn btn-primary">Add IP</button>
            </form>
        `;
    } catch (error) {
        modalBody.innerHTML = `
            <h2>Add New IP</h2>
            <div style="color: red;">Error loading users: ${error.message}</div>
            <button onclick="closeModal()" class="btn">Close</button>
        `;
    }
}

async function addIP(event) {
    event.preventDefault();

    const userId = document.getElementById('newIPUserId').value;
    const ip = document.getElementById('newIPAddress').value;

    try {
        await IPsAPI.create(userId, ip);
        closeModal();
        loadIPs();
        await showAlert('IP added successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function editIP(id) {
    const ip = ipsData.find(i => i.id === id);
    if (!ip) return;

    const modalBody = document.getElementById('modalBody');

    // Show loading state
    modalBody.innerHTML = `
        <h2>Edit IP</h2>
        <div class="loading-text">Loading users...</div>
    `;
    openModal();

    try {
        // Fetch users if not already loaded
        if (usersData.length === 0) {
            const data = await UsersAPI.getAll();
            usersData = data.users || [];
        }

        // Generate users dropdown options with current user selected
        const userOptions = usersData
            .map(user => `<option value="${user.id}" ${user.id == ip.userid ? 'selected' : ''}>${user.name} (${user.email})</option>`)
            .join('');

        modalBody.innerHTML = `
            <h2>Edit IP</h2>
            <form onsubmit="updateIP(event, ${id})">
                <div class="form-group">
                    <label>Select User</label>
                    <select id="editIPUserId" required>
                        <option value="">-- Select a user --</option>
                        ${userOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>IP Address</label>
                    <input type="text" id="editIPAddress" value="${ip.ip}" required>
                </div>
                <button type="submit" class="btn btn-primary">Update IP</button>
            </form>
        `;
    } catch (error) {
        modalBody.innerHTML = `
            <h2>Edit IP</h2>
            <div style="color: red;">Error loading users: ${error.message}</div>
            <button onclick="closeModal()" class="btn">Close</button>
        `;
    }
}

async function updateIP(event, id) {
    event.preventDefault();

    const userId = document.getElementById('editIPUserId').value;
    const ip = document.getElementById('editIPAddress').value;

    try {
        await IPsAPI.update(id, userId, ip);
        closeModal();
        loadIPs();
        await showAlert('IP updated successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function deleteIP(id) {
    const confirmed = await showConfirm(
        'Are you sure you want to delete this IP?',
        'Delete IP'
    );

    if (!confirmed) {
        return;
    }

    try {
        await IPsAPI.delete(id);
        loadIPs();
        await showAlert('IP deleted successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

// ========== SETTINGS MANAGEMENT ==========

async function loadSettings() {
    const tbody = document.getElementById('settingsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading settings...</td></tr>';

    try {
        const data = await SettingsAPI.getAll();
        // Server already filters out protected settings (openai_api_key, selected_gpt_model)
        settingsData = data.settings || [];
        renderSettings(settingsData);
    } catch (error) {
        // Check if it's an auth error (user already redirected to login)
        if (error.message.includes('Session expired')) {
            return; // Don't show error, user is being redirected
        }
        tbody.innerHTML = `<tr><td colspan="5" class="loading" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function renderSettings(settings) {
    const tbody = document.getElementById('settingsTableBody');

    if (settings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No settings found</td></tr>';
        return;
    }

    tbody.innerHTML = settings.map(setting => `
        <tr>
            <td>${setting.id}</td>
            <td><strong>${setting.key}</strong></td>
            <td>${setting.value}</td>
            <td>${new Date(setting.created_at).toLocaleDateString()}</td>
            <td>
                <div class="btn-group">
                    <button onclick="editSetting(${setting.id})" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="deleteSetting(${setting.id})" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterSettings() {
    const searchText = document.getElementById('settingSearch').value.toLowerCase();
    const filtered = settingsData.filter(setting =>
        setting.key.toLowerCase().includes(searchText) ||
        setting.value.toLowerCase().includes(searchText)
    );
    renderSettings(filtered);
}

function showAddSettingModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Add New Setting</h2>
        <form onsubmit="addSetting(event)">
            <div class="form-group">
                <label>Key</label>
                <input type="text" id="newSettingKey" required placeholder="max_login_attempts">
            </div>
            <div class="form-group">
                <label>Value</label>
                <input type="text" id="newSettingValue" required placeholder="5">
            </div>
            <button type="submit" class="btn btn-primary">Add Setting</button>
        </form>
    `;
    openModal();
}

async function addSetting(event) {
    event.preventDefault();

    const key = document.getElementById('newSettingKey').value;
    const value = document.getElementById('newSettingValue').value;

    try {
        await SettingsAPI.create(key, value);
        closeModal();
        loadSettings();
        await showAlert('Setting added successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

function editSetting(id) {
    const setting = settingsData.find(s => s.id === id);
    if (!setting) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit Setting</h2>
        <form onsubmit="updateSetting(event, ${id})">
            <div class="form-group">
                <label>Key</label>
                <input type="text" id="editSettingKey" value="${setting.key}" required>
            </div>
            <div class="form-group">
                <label>Value</label>
                <input type="text" id="editSettingValue" value="${setting.value}" required>
            </div>
            <button type="submit" class="btn btn-primary">Update Setting</button>
        </form>
    `;
    openModal();
}

async function updateSetting(event, id) {
    event.preventDefault();

    const key = document.getElementById('editSettingKey').value;
    const value = document.getElementById('editSettingValue').value;

    try {
        await SettingsAPI.update(id, key, value);
        closeModal();
        loadSettings();
        await showAlert('Setting updated successfully!', 'Success');
    } catch (error) {
        await showAlert('Error: ' + error.message, 'Error');
    }
}

async function deleteSetting(id) {
    const confirmed = await showConfirm(
        'Are you sure you want to delete this setting?',
        'Delete Setting'
    );

    if (!confirmed) {
        return;
    }

    try {
        await SettingsAPI.delete(id);
        loadSettings();
        await showAlert('Setting deleted successfully!', 'Success');
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
