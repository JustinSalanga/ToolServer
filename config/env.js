const path = require('path');

/**
 * Environment Configuration Loader
 *
 * This module handles loading environment variables for both development and production (pkg) environments.
 * - In development: Uses dotenv to load from .env file
 * - In pkg executable: Loads embedded configuration from production.config.js (no external .env needed)
 */
function loadEnvironment() {
    // Check if running inside pkg
    const isPkg = typeof process.pkg !== 'undefined';

    if (isPkg) {
        // Running as executable - load embedded production config
        console.log('📦 Running as packaged executable');

        try {
            // Load embedded production configuration
            const productionConfig = require('./production.config');

            console.log('🔧 Loading embedded production configuration...');

            // Set all configuration values to process.env
            Object.keys(productionConfig).forEach(key => {
                if (!process.env[key]) {
                    process.env[key] = productionConfig[key];
                }
            });

            console.log('✅ Production configuration loaded successfully');
        } catch (error) {
            console.error('❌ Error loading production configuration:', error.message);
            console.error('Please ensure production.config.js is properly configured before building.');
            return false;
        }
    } else {
        // Running in development - use regular dotenv
        console.log('💻 Running in development mode');
        require('dotenv').config();
        console.log('✅ Environment variables loaded from dotenv');
    }

    // Validate required environment variables
    const required = ['PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.error('❌ Please check your .env file');

        // Show current directory for debugging
        console.log('📁 Current directory:', process.cwd());
        console.log('📁 Executable directory:', isPkg ? path.dirname(process.execPath) : 'N/A');

        return false;
    }

    // Log configuration (without sensitive data)
    console.log('📋 Database Configuration:');
    console.log('   Host:', process.env.PG_HOST);
    console.log('   Password:', process.env.PG_PASSWORD ? '***' : 'NOT SET');
    console.log('   Server Port:', process.env.PORT || 3000);

    return true;
}

module.exports = { loadEnvironment };
