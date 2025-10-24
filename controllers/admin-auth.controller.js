const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const model = require('../database/model');
const { handleError } = require('../utils/utils');
const { getClientIP } = require('../utils/ip.utils');

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Get client IP address
        const clientIP = getClientIP(req);

        // Find user by email
        const user = await model.getUserByEmail(email);
        if (!user) {
            return handleError(res, 401, 'Invalid email');
        }

        // Check if user is blocked
        if (user.blocked === 0) {
            return handleError(res, 403, 'Your account has been blocked');
        }

        // Check if user has admin role
        if (user.role !== 'admin') {
            return handleError(res, 403, 'Access denied. Admin privileges required.');
        }

        // Verify IP address - must match registration IP
        if (user.registration_ip && user.registration_ip !== clientIP && clientIP !== '127.0.0.1') {
            console.warn(`Admin login attempt from different IP. User: ${email}, Registered IP: ${user.registration_ip}, Request IP: ${clientIP}`);
            return handleError(res, 403, 'Login from this IP address is not allowed');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return handleError(res, 401, 'Invalid password');
        }

        // Generate JWT token with admin secret
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: 'admin',
                authType: 'admin'
            },
            process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'admin-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove password from response
        delete user.password;

        res.status(200).json({
            message: 'Admin login successful',
            token,
            user
        });
    } catch (error) {
        console.error('Admin login error:', error);
        handleError(res, 500, 'Error logging in as admin');
    }
}

exports.adminRegister = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Get client IP address
        const clientIP = getClientIP(req);

        // Check if user already exists with this email
        const existingUser = await model.getUserByEmail(email);
        if (existingUser) {
            return handleError(res, 400, 'User with this email already exists');
        }

        // Check if user already registered from this IP address
        const ipUser = await model.getUserByIP(clientIP);
        if (ipUser) {
            return handleError(res, 403, 'A user has already been registered from this IP address');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this is the first user (make them admin)
        const existingUsers = await model.getUsers();
        const userRole = existingUsers.length === 0 ? 'admin' : 'admin'; // Force admin role for admin registration
        
        // Create user with registration IP and admin role
        const newUser = await model.createUser(name, email, hashedPassword, clientIP, userRole);
        console.log(`Admin registered with IP ${clientIP}: ${newUser.email}`);

        // Remove password from response
        delete newUser.password;

        res.status(201).json({
            message: 'Admin registered successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        handleError(res, 500, 'Error registering admin');
    }
}

exports.adminVerify = async (req, res) => {
    try {
        // Token is already verified by the authenticate middleware
        // req.user contains the decoded user data
        const user = await model.getUserById(req.user.id);

        if (!user) {
            return handleError(res, 404, 'User not found');
        }

        // Check if user is blocked
        if (user.blocked === 0) {
            return handleError(res, 403, 'Your account has been blocked');
        }

        // Check if user has admin role
        if (user.role !== 'admin') {
            return handleError(res, 403, 'Access denied. Admin privileges required.');
        }

        // Generate new JWT token with admin secret
        const newToken = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: 'admin',
                authType: 'admin'
            },
            process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'admin-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove password from response
        delete user.password;

        res.status(200).json({
            message: 'Admin token verified successfully',
            token: newToken,
            user
        });
    } catch (error) {
        console.error('Admin verify token error:', error);
        handleError(res, 500, 'Error verifying admin token');
    }
}
