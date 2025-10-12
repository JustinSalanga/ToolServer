/**
 * IP Address Utility Functions
 * Extracts client IP address from request, handling proxies and load balancers
 */

/**
 * Get client IP address from request
 * Checks multiple headers to handle proxies, load balancers, and direct connections
 *
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIP(req) {
    // Check various headers in order of reliability
    const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||  // Proxy/Load balancer
        req.headers['x-real-ip'] ||                                // Nginx proxy
        req.headers['cf-connecting-ip'] ||                         // Cloudflare
        req.connection?.remoteAddress ||                           // Direct connection
        req.socket?.remoteAddress ||                               // Socket connection
        req.connection?.socket?.remoteAddress ||                   // Backup
        'unknown';

    // Clean up IPv6 localhost to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }

    // Remove IPv6 prefix if present
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }

    return ip;
}

module.exports = {
    getClientIP
};
