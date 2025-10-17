const passport = require('../config/passport');
const { handleError } = require("./utils");

exports.validateRegister = (req, res, next) => {
    const { name, email, password, confirm_password } = req.body;

    if (!name) {
        return handleError(res, 400, "Name field is required.");
    }
    if (!email) {
        return handleError(res, 400, "Email field is required.");
    }
    if (!email.includes('@')) {
        return handleError(res, 400, "Please enter a valid email.");
    }
    if (!password) {
        return handleError(res, 400, "Password field is required.");
    }
    if (!confirm_password) {
        return handleError(res, 400, "You must confirm your password.");
    }
    if (password !== confirm_password) {
        return handleError(res, 400, "Your password does not match.");
    }

    next();
}

exports.validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email) {
        return handleError(res, 400, "Email field is required.");
    }
    if (!email.includes('@')) {
        return handleError(res, 400, "Please enter a valid email.");
    }
    if (!password) {
        return handleError(res, 400, "Password field is required.");
    }

    next();
}

// Passport JWT authentication middleware
exports.authenticate = passport.authenticate('jwt', { session: false });

// Role-based authentication middleware
exports.authenticateAdmin = (req, res, next) => {
    // First authenticate the user
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return handleError(res, 500, 'Authentication error');
        }
        if (!user) {
            return handleError(res, 401, 'Authentication required');
        }
        
        // Check if user has admin role
        if (user.role !== 'admin') {
            return handleError(res, 403, 'Admin access required');
        }
        
        req.user = user;
        next();
    })(req, res, next);
};

// Custom error handler for authentication failures
exports.handleAuthError = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return handleError(res, 401, 'Invalid or expired token');
    }
    next(err);
}