const model = require('../database/model');
const { handleError } = require('../utils/utils');
const { getClientIP } = require('../utils/ip.utils');

exports.getAllowedEmails = async (req, res) => {
    try {
        const emails = await model.getAllowedEmails();
        res.status(200).json({
            emails
        });
    } catch (error) {
        console.error('Get allowed emails error:', error);
        handleError(res, 500, 'Error fetching allowed emails');
    }
}

exports.getAllowedEmail = async (req, res) => {
    const { id } = req.params;

    try {
        const email = await model.getAllowedEmailById(id);

        if (!email) {
            return handleError(res, 404, 'Allowed email not found');
        }

        res.status(200).json({
            email
        });
    } catch (error) {
        console.error('Get allowed email error:', error);
        handleError(res, 500, 'Error fetching allowed email');
    }
}

exports.createAllowedEmail = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return handleError(res, 400, 'Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return handleError(res, 400, 'Invalid email format');
    }

    try {
        // Check if email already exists
        const existing = await model.getAllowedEmailByEmail(email);
        if (existing) {
            return handleError(res, 400, 'Email already in allowed list');
        }

        const newEmail = await model.createAllowedEmail(email);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'create',
            'allowed_email',
            newEmail.id,
            `Allowed email added: ${email}`,
            clientIP,
            { email }
        );

        res.status(201).json({
            message: 'Allowed email created successfully',
            email: newEmail
        });
    } catch (error) {
        console.error('Create allowed email error:', error);
        handleError(res, 500, 'Error creating allowed email');
    }
}

exports.updateAllowedEmail = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
        return handleError(res, 400, 'Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return handleError(res, 400, 'Invalid email format');
    }

    try {
        // Check if email exists
        const existingEmail = await model.getAllowedEmailById(id);
        if (!existingEmail) {
            return handleError(res, 404, 'Allowed email not found');
        }

        // Check if new email is already taken by another entry
        if (email !== existingEmail.email) {
            const emailTaken = await model.getAllowedEmailByEmail(email);
            if (emailTaken) {
                return handleError(res, 400, 'Email already in allowed list');
            }
        }

        const updatedEmail = await model.updateAllowedEmail(id, email);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'update',
            'allowed_email',
            id,
            `Allowed email updated: ${email}`,
            clientIP,
            { email, old_email: existingEmail.email }
        );

        res.status(200).json({
            message: 'Allowed email updated successfully',
            email: updatedEmail
        });
    } catch (error) {
        console.error('Update allowed email error:', error);
        handleError(res, 500, 'Error updating allowed email');
    }
}

exports.deleteAllowedEmail = async (req, res) => {
    const { id } = req.params;

    try {
        const email = await model.getAllowedEmailById(id);
        if (!email) {
            return handleError(res, 404, 'Allowed email not found');
        }

        await model.deleteAllowedEmail(id);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'delete',
            'allowed_email',
            id,
            `Allowed email deleted: ${email.email}`,
            clientIP,
            { email: email.email }
        );

        res.status(200).json({
            message: 'Allowed email deleted successfully'
        });
    } catch (error) {
        console.error('Delete allowed email error:', error);
        handleError(res, 500, 'Error deleting allowed email');
    }
}

