/**
 * Startup Authentication Module
 *
 * Prompts for password when the application starts.
 * Blocks execution if password is invalid.
 */

const readline = require('readline');
const crypto = require('crypto');

/**
 * Create readline interface for password input
 */
function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Hash password using SHA-256
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Prompt for password with hidden input (shows asterisks)
 */
function promptPassword(rl, prompt) {
    return new Promise((resolve) => {
        let password = '';

        // Write prompt
        process.stdout.write(prompt);

        // Mute output by overriding _writeToOutput
        const originalWrite = rl._writeToOutput;
        rl._writeToOutput = function(stringToWrite) {
            // Capture each character that would be written
            for (let i = 1; i < stringToWrite.length; i++) {
                const char = stringToWrite[i];
                const charCode = char.charCodeAt(0);

                // Skip control characters except backspace
                if (charCode < 32 && charCode !== 8 && charCode !== 13) {
                    continue;
                }

                // Don't display the character, just capture it
                if (charCode !== 13 && charCode !== 10 && charCode !== 8) {
                    password += char;
                    rl.output.write('*'); // Show asterisk instead
                } else if (charCode === 8 || charCode === 127) {
                    // Backspace
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        rl.output.write('\b \b');
                    }
                }
            }
        };

        rl.question('', (answer) => {
            // Restore original write function
            rl._writeToOutput = originalWrite;
            rl.output.write('\n');
            // Use password if captured (interactive), otherwise use answer (piped) - trim whitespace
            const finalPassword = password.trimEnd() || (answer ? answer.trim() : '');
            resolve(finalPassword);
        });
    });
}

/**
 * Main authentication function
 * @param {string} configuredPassword - The password from configuration (can be plain or hashed)
 * @param {boolean} isHashed - Whether the configured password is already hashed
 * @param {number} maxAttempts - Maximum number of attempts (default: 3)
 * @returns {Promise<boolean>} - Returns true if authenticated
 */
async function authenticateStartup(configuredPassword, isHashed = false, maxAttempts = 3) {
    console.log('='.repeat(60));
    console.log('🔒 TailorResume Auth Server - Startup Authentication');
    console.log('='.repeat(60));
    console.log();

    // If no password configured, skip authentication
    if (!configuredPassword || configuredPassword === '') {
        console.log('⚠️  No startup password configured. Skipping authentication.');
        console.log('   To enable startup protection, set STARTUP_PASSWORD in config.');
        console.log();
        return true;
    }

    const expectedHash = isHashed ? configuredPassword : hashPassword(configuredPassword);

    const rl = createInterface();
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;

        const remainingAttempts = maxAttempts - attempts + 1;
        console.log(`🔐 Please enter the startup password (Attempt ${attempts}/${maxAttempts}):`);

        try {
            const inputPassword = await promptPassword(rl, '   Password: ');

            const inputHash = hashPassword(inputPassword);
        
            if (inputHash === expectedHash) {
                rl.close();
                console.log('✅ Authentication successful!');
                console.log('🚀 Starting server...');
                console.log();
                return true;
            } else {
                if (attempts < maxAttempts) {
                    console.log(`❌ Invalid password! ${remainingAttempts - 1} attempt(s) remaining.`);
                    console.log();
                } else {
                    console.log('❌ Invalid password!');
                }
            }
        } catch (error) {
            rl.close();
            console.error('❌ Error reading password:', error.message);
            return false;
        }
    }

    rl.close();
    console.log();
    console.log('='.repeat(60));
    console.log('🚫 AUTHENTICATION FAILED');
    console.log('='.repeat(60));
    console.log('❌ Maximum attempts exceeded. Application startup blocked.');
    console.log('💡 Please contact the administrator for assistance.');
    console.log();

    return false;
}

/**
 * Generate a hash for a password (utility function)
 */
function generatePasswordHash(password) {
    return hashPassword(password);
}

module.exports = {
    authenticateStartup,
    generatePasswordHash
};
