const db = require('./db');  // importing the module above

exports.getUsers = async () => {
    const res = await db.query('SELECT * FROM users');
    return res.rows;  // .rows is an array of result rows
}

exports.getUserById = async (id) => {
    const res = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
    );
    return res.rows[0];
}

exports.createUser = async (name, email, password, registration_ip, role = 'user') => {
    const res = await db.query(
        `INSERT INTO users (name, email, password, registration_ip, role) VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [name, email, password, registration_ip, role]
    );
    return res.rows[0];
}

exports.getUserByEmail = async (email) => {
    const res = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return res.rows[0];
}

exports.updateUser = async (id, name, email, registration_ip, role) => {
    const res = await db.query(
        'UPDATE users SET name = $1, email = $2, registration_ip = $3, role = $4 WHERE id = $5 RETURNING *',
        [name, email, registration_ip, role, id]
    );
    return res.rows[0];
}

exports.deleteUser = async (id) => {
    const res = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [id]
    );
    return res.rows[0];
}

exports.toggleUserBlock = async (id, blocked) => {
    const res = await db.query(
        'UPDATE users SET blocked = $1 WHERE id = $2 RETURNING *',
        [blocked, id]
    );
    return res.rows[0];
}

// Helper function to get user by registration IP
exports.getUserByIP = async (ip) => {
    const res = await db.query(
        'SELECT * FROM users WHERE registration_ip = $1',
        [ip]
    );
    return res.rows[0];
}

// Settings Management Functions
exports.getSettings = async () => {
    const res = await db.query('SELECT * FROM settings ORDER BY created_at DESC');
    return res.rows;
}

exports.getSettingById = async (id) => {
    const res = await db.query(
        'SELECT * FROM settings WHERE id = $1',
        [id]
    );
    return res.rows[0];
}

exports.getSettingByKey = async (key) => {
    const res = await db.query(
        'SELECT * FROM settings WHERE key = $1',
        [key]
    );
    return res.rows[0];
}

exports.createSetting = async (key, value) => {
    const res = await db.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING *',
        [key, value]
    );
    return res.rows[0];
}

exports.updateSetting = async (id, key, value) => {
    const res = await db.query(
        'UPDATE settings SET key = $1, value = $2 WHERE id = $3 RETURNING *',
        [key, value, id]
    );
    return res.rows[0];
}

exports.deleteSetting = async (id) => {
    const res = await db.query(
        'DELETE FROM settings WHERE id = $1 RETURNING *',
        [id]
    );
    return res.rows[0];
}

// User Configuration Management Functions
exports.getAllConfigs = async () => {
    const res = await db.query(
        'SELECT * FROM user_configs ORDER BY updated_at DESC'
    );
    return res.rows;
}

exports.getConfigByEmail = async (userEmail) => {
    const res = await db.query(
        'SELECT * FROM user_configs WHERE user_email = $1',
        [userEmail]
    );
    return res.rows[0];
}

exports.createOrUpdateConfig = async (userEmail, field, value) => {
    // First check if config exists
    const existing = await db.query(
        'SELECT * FROM user_configs WHERE user_email = $1',
        [userEmail]
    );

    if (existing.rows.length > 0) {
        // Update existing
        const res = await db.query(
            `UPDATE user_configs SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_email = $2 RETURNING *`,
            [value, userEmail]
        );
        return res.rows[0];
    } else {
        // Create new
        const res = await db.query(
            `INSERT INTO user_configs (user_email, ${field}) VALUES ($1, $2) RETURNING *`,
            [userEmail, value]
        );
        return res.rows[0];
    }
}

exports.savePrompt = async (userEmail, prompt) => {
    return exports.createOrUpdateConfig(userEmail, 'prompt', prompt);
}

exports.saveResume = async (userEmail, resume) => {
    return exports.createOrUpdateConfig(userEmail, 'resume', resume);
}

exports.saveTemplate = async (userEmail, templatePath) => {
    return exports.createOrUpdateConfig(userEmail, 'template_path', templatePath);
}

exports.saveFolder = async (userEmail, folderPath) => {
    return exports.createOrUpdateConfig(userEmail, 'folder_path', folderPath);
}

// Job Management Functions
exports.getJobs = async (date = null) => {
    let query = 'SELECT * FROM jobs';
    let params = [];
    
    if (date) {
        query += ' WHERE DATE(created_at) = $1';
        params.push(date);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const res = await db.query(query, params);
    return res.rows;
}

exports.getJobById = async (jobId) => {
    const res = await db.query(
        'SELECT * FROM jobs WHERE id = $1',
        [jobId]
    );
    return res.rows[0];
}

exports.getJobByUrl = async (url) => {
    const res = await db.query(
        'SELECT * FROM jobs WHERE url = $1',
        [url]
    );
    return res.rows[0];
}

// URL normalization functions from bid_check.js
function extractTargetUrl(url) {
    const urlObj = new URL(url);
    
    // Handle known redirect patterns
    const redirectDomains = {
        'www.indeed.com': 'jk',
        'www.wiraa.com': 'source'
    };
    
    if (redirectDomains[urlObj.hostname]) {
        const targetParam = redirectDomains[urlObj.hostname];
        const params = new URLSearchParams(urlObj.search);
        
        // For Indeed, you might not get the full job URL, just job key
        if (redirectDomains[urlObj.hostname] === 'jk' && params.has('jk')) {
            return `https://${urlObj.hostname}/viewjob?jk=${params.get('jk')}`;
        }
        
        if (params.has(targetParam)) {
            // Decode the redirect target
            return decodeURIComponent(params.get(targetParam));
        }
    }
    
    // If not a known redirector, return the original with normalized query
    return normalizeQuery(url);
}

function normalizeQuery(url) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Sort query parameters
    const sortedParams = new URLSearchParams();
    const sortedKeys = Array.from(params.keys()).sort();
    
    for (const key of sortedKeys) {
        sortedParams.append(key, params.get(key));
    }
    
    urlObj.search = sortedParams.toString();
    return urlObj.toString();
}

function normalizeFinalUrl(url) {
    const urlObj = new URL(url);
    
    // Remove www. prefix and convert to lowercase
    let hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    let pathname = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash
    
    // Normalize query parameters
    const params = new URLSearchParams(urlObj.search);
    const sortedParams = new URLSearchParams();
    const sortedKeys = Array.from(params.keys()).sort();
    
    for (const key of sortedKeys) {
        sortedParams.append(key, params.get(key));
    }
    
    return `${urlObj.protocol}//${hostname}${pathname}?${sortedParams.toString()}`;
}

function clearLink(link) {
    link = String(link);
    
    // Remove query parameters for certain domains
    if (link.includes('?') && 
        !link.includes('indeed') && 
        !link.includes('builtin') && 
        !link.includes('wellfound') && 
        !link.includes('wiraa')) {
        link = link.split('?')[0];
    }
    
    // Remove trailing slash
    if (link.endsWith('/')) {
        link = link.slice(0, -1);
    }
    
    // Remove /apply suffix
    if (link.endsWith('/apply')) {
        link = link.slice(0, -6);
    }
    
    // Remove /application suffix
    if (link.endsWith('/application')) {
        link = link.slice(0, -12);
    }
    
    // Handle Indeed URLs
    if (link.includes('www.indeed.com')) {
        link = extractTargetUrl(link);
    }
    
    return link;
}

// Function to normalize URL using bid_check.js logic
function normalizeUrl(url) {
    try {
        // First clear the link using bid_check logic
        const clearedUrl = clearLink(url);
        // Then normalize the final URL
        return normalizeFinalUrl(clearedUrl);
    } catch (error) {
        // If URL is invalid, return as is
        return url;
    }
}

exports.getJobByNormalizedUrl = async (url) => {
    const normalizedUrl = normalizeUrl(url);
    const res = await db.query(
        'SELECT * FROM jobs WHERE normalized_url = $1',
        [normalizedUrl]
    );
    return res.rows[0];
}

exports.getJobByTitleAndCompany = async (title, company) => {
    const res = await db.query(
        'SELECT * FROM jobs WHERE title = $1 AND company = $2',
        [title, company]
    );
    return res.rows[0];
}

exports.createJob = async (jobId, title, company, tech, url, description) => {
    const normalizedUrl = url ? normalizeUrl(url) : null;
    const res = await db.query(
        `INSERT INTO jobs (id, title, company, tech, url, normalized_url, description) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [jobId, title, company, tech, url, normalizedUrl, description]
    );
    return res.rows[0];
}

exports.updateJob = async (jobId, title, company, tech, url, description) => {
    const normalizedUrl = url ? normalizeUrl(url) : null;
    const res = await db.query(
        `UPDATE jobs SET title = $1, company = $2, tech = $3, url = $4, normalized_url = $5, description = $6, 
         updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`,
        [title, company, tech, url, normalizedUrl, description, jobId]
    );
    return res.rows[0];
}

exports.deleteJob = async (jobId) => {
    const res = await db.query(
        'DELETE FROM jobs WHERE id = $1 RETURNING *',
        [jobId]
    );
    return res.rows[0];
}