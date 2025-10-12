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

// Custom error handler for authentication failures
exports.handleAuthError = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return handleError(res, 401, 'Invalid or expired token');
    }
    next(err);
}