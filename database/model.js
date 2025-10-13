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

exports.createUser = async (name, email, password, registration_ip) => {
    const res = await db.query(
        `INSERT INTO users (name, email, password, registration_ip) VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [name, email, password, registration_ip]
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

exports.updateUser = async (id, name, email, registration_ip) => {
    const res = await db.query(
        'UPDATE users SET name = $1, email = $2, registration_ip = $3 WHERE id = $4 RETURNING *',
        [name, email, registration_ip, id]
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
