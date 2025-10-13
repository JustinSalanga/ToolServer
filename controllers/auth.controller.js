const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const model = require('../database/model');
const { handleError } = require('../utils/utils');
const { getClientIP } = require('../utils/ip.utils');

exports.register = async (req, res) => {
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
        const ipUser = await model.getUserByRegistrationIP(clientIP);
        if (ipUser) {
            return handleError(res, 403, 'A user has already been registered from this IP address');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with registration IP
        const newUser = await model.createUser(name, email, hashedPassword, clientIP);

        // Save IP to ips table with the new user's email
        try {
            await model.createIP(newUser.id, clientIP);
            console.log(`IP ${clientIP} saved to ips table for user: ${newUser.email}`);
        } catch (ipError) {
            // Log error but don't fail registration if IP save fails
            console.error('Error saving IP to ips table:', ipError);
        }

        // Remove password from response
        delete newUser.password;

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Registration error:', error);
        handleError(res, 500, 'Error registering user');
    }
}

exports.login = async (req, res) => {
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

        // Verify IP address - must match registration IP
        if (user.registration_ip && user.registration_ip !== clientIP) {
            console.warn(`Login attempt from different IP. User: ${email}, Registered IP: ${user.registration_ip}, Request IP: ${clientIP}`);
            return handleError(res, 403, 'Login from this IP address is not allowed');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return handleError(res, 401, 'Invalid password');
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete user.password;

        res.status(200).json({
            message: 'Login successful',
            token,
            user
        });
    } catch (error) {
        console.error('Login error:', error);
        handleError(res, 500, 'Error logging in');
    }
}

exports.getUsers = async (req, res) => {
    try {
        const users = await model.getUsers();

        // Remove passwords from response
        const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.status(200).json({
            users: sanitizedUsers
        });
    } catch (error) {
        console.error('Get users error:', error);
        handleError(res, 500, 'Error fetching users');
    }
}

exports.getUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await model.getUserById(id);

        if (!user) {
            return handleError(res, 404, 'User not found');
        }

        // Remove password from response
        delete user.password;

        res.status(200).json({
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        handleError(res, 500, 'Error fetching user');
    }
}

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    try {
        // Check if user exists
        const existingUser = await model.getUserById(id);
        if (!existingUser) {
            return handleError(res, 404, 'User not found');
        }

        // Check if email is already taken by another user
        if (email !== existingUser.email) {
            const emailTaken = await model.getUserByEmail(email);
            if (emailTaken) {
                return handleError(res, 400, 'Email already in use');
            }
        }

        // Update user
        const updatedUser = await model.updateUser(id, name, email);

        // Remove password from response
        delete updatedUser.password;

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        handleError(res, 500, 'Error updating user');
    }
}

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await model.getUserById(id);
        if (!user) {
            return handleError(res, 404, 'User not found');
        }

        await model.deleteUser(id);

        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        handleError(res, 500, 'Error deleting user');
    }
}

exports.toggleBlock = async (req, res) => {
    const { id } = req.params;
    const { blocked } = req.body;

    try {
        const user = await model.getUserById(id);
        if (!user) {
            return handleError(res, 404, 'User not found');
        }

        const updatedUser = await model.toggleUserBlock(id, blocked);

        // Remove password from response
        delete updatedUser.password;

        res.status(200).json({
            message: `User ${blocked === 0 ? 'blocked' : 'unblocked'} successfully`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Toggle block error:', error);
        handleError(res, 500, 'Error toggling user block status');
    }
}

exports.verify = async (req, res) => {
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

        // Generate new JWT token
        const newToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete user.password;

        res.status(200).json({
            message: 'Token verified successfully',
            token: newToken,
            user
        });
    } catch (error) {
        console.error('Verify token error:', error);
        handleError(res, 500, 'Error verifying token');
    }
}