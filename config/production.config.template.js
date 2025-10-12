/**
 * Production Configuration Template
 *
 * This is a TEMPLATE file - copy it to production.config.js and fill in your actual values.
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file: cp production.config.template.js production.config.js
 * 2. Edit production.config.js with your actual credentials
 * 3. NEVER commit production.config.js to version control (it's in .gitignore)
 * 4. Build the executable: npm run build:win
 *
 * The configuration will be embedded into the executable.
 */

module.exports = {
    // Server Configuration
    PORT: '3000',
    NODE_ENV: 'production',

    // JWT Configuration
    // IMPORTANT: Generate a strong secret key for production!
    // Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    JWT_SECRET: 'CHANGE-THIS-TO-A-STRONG-RANDOM-SECRET',
    JWT_EXPIRES_IN: '24h',

    // PostgreSQL Database Configuration
    // Replace these with your actual PostgreSQL credentials
    // IMPORTANT: Use '127.0.0.1' instead of 'localhost' to force IPv4 connection
    // This prevents EACCES errors on Windows where localhost resolves to IPv6 (::1)
    PG_HOST: '127.0.0.1',              // Database host (use '127.0.0.1' for local, or IP like '192.168.1.100')
    PG_PORT: '5432',                   // PostgreSQL port (default: 5432)
    PG_DATABASE: 'tailor_resume_auth', // Database name
    PG_USER: 'postgres',               // Database user
    PG_PASSWORD: 'YOUR-DATABASE-PASSWORD-HERE', // Database password

    // Application Settings
    BCRYPT_SALT_ROUNDS: '10',

    // Startup Password Protection
    // This password will be required when the application starts
    // IMPORTANT: Change this to a strong password!
    // Leave empty ('') to disable startup password protection
    STARTUP_PASSWORD: 'YOUR-STARTUP-PASSWORD-HERE',  // Password required to start the app
    STARTUP_PASSWORD_HASHED: 'false',  // Set to 'true' if password is pre-hashed with SHA-256
    STARTUP_MAX_ATTEMPTS: '3',  // Number of password attempts before blocking (default: 3)

    // CORS Settings (optional)
    // Uncomment and configure if you need CORS
    // CORS_ORIGIN: 'http://localhost:3000',

    // Additional Settings
    // Add any other environment variables your application needs
};
