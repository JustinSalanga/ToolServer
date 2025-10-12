/**
 * Generate Password Hash for Startup Protection
 *
 * This script generates a SHA-256 hash for a password.
 * Use this to create a hashed password for STARTUP_PASSWORD in production.config.js
 */

const { generatePasswordHash } = require('../utils/startup-auth');
const readline = require('readline');

console.log('='.repeat(60));
console.log('Password Hash Generator');
console.log('='.repeat(60));
console.log();
console.log('This tool generates a SHA-256 hash for your startup password.');
console.log('You can use the hash in production.config.js for extra security.');
console.log();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter the password to hash: ', (password) => {
    if (!password || password.trim() === '') {
        console.log('❌ Password cannot be empty');
        rl.close();
        return;
    }

    const hash = generatePasswordHash(password);

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Password Hash Generated');
    console.log('='.repeat(60));
    console.log();
    console.log('Original Password:', password);
    console.log('SHA-256 Hash:', hash);
    console.log();
    console.log('To use this hash in production.config.js:');
    console.log();
    console.log('1. Copy the hash above');
    console.log('2. Open config/production.config.js');
    console.log('3. Set: STARTUP_PASSWORD: \'' + hash + '\'');
    console.log('4. Set: STARTUP_PASSWORD_HASHED: \'true\'');
    console.log();
    console.log('Example:');
    console.log('  STARTUP_PASSWORD: \'' + hash + '\',');
    console.log('  STARTUP_PASSWORD_HASHED: \'true\',');
    console.log();
    console.log('⚠️  Keep the original password in a safe place!');
    console.log('   You\'ll need it to start the application.');
    console.log();

    rl.close();
});
