const model = require('../database/model');
const { handleError } = require('../utils/utils');

exports.getIPs = async (req, res) => {
    try {
        const ips = await model.getIPs();

        res.status(200).json({
            ips
        });
    } catch (error) {
        console.error('Get IPs error:', error);
        handleError(res, 500, 'Error fetching IPs');
    }
}

exports.getIP = async (req, res) => {
    const { id } = req.params;

    try {
        const ip = await model.getIPById(id);

        if (!ip) {
            return handleError(res, 404, 'IP not found');
        }

        res.status(200).json({
            ip
        });
    } catch (error) {
        console.error('Get IP error:', error);
        handleError(res, 500, 'Error fetching IP');
    }
}

exports.getIPsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const ips = await model.getIPsByUser(userId);

        res.status(200).json({
            ips
        });
    } catch (error) {
        console.error('Get IPs by userId error:', error);
        handleError(res, 500, 'Error fetching IPs for userId');
    }
}

exports.getUserByIP = async (req, res) => {
    const { ip } = req.params;

    try {
        const user = await model.getUserByIP(ip);

        if (!user) {
            return handleError(res, 404, 'User not found for this IP address');
        }

        res.status(200).json({
            user
        });
    } catch (error) {
        console.error('Get user by IP error:', error);
        handleError(res, 500, 'Error fetching user by IP');
    }
}

exports.createIP = async (req, res) => {
    const { userId, ip } = req.body;

    try {
        if (!userId || !ip) {
            return handleError(res, 400, 'UserId and IP are required');
        }

        const newIP = await model.createIP(userId, ip);

        res.status(201).json({
            message: 'IP created successfully',
            ip: newIP
        });
    } catch (error) {
        console.error('Create IP error:', error);
        handleError(res, 500, 'Error creating IP');
    }
}

exports.updateIP = async (req, res) => {
    const { id } = req.params;
    const { userId, ip } = req.body;

    try {
        const existingIP = await model.getIPById(id);
        if (!existingIP) {
            return handleError(res, 404, 'IP not found');
        }

        if (!userId || !ip) {
            return handleError(res, 400, 'UserId and IP are required');
        }

        const updatedIP = await model.updateIP(id, userId, ip);

        res.status(200).json({
            message: 'IP updated successfully',
            ip: updatedIP
        });
    } catch (error) {
        console.error('Update IP error:', error);
        handleError(res, 500, 'Error updating IP');
    }
}

exports.deleteIP = async (req, res) => {
    const { id } = req.params;

    try {
        const ip = await model.getIPById(id);
        if (!ip) {
            return handleError(res, 404, 'IP not found');
        }

        await model.deleteIP(id);

        res.status(200).json({
            message: 'IP deleted successfully'
        });
    } catch (error) {
        console.error('Delete IP error:', error);
        handleError(res, 500, 'Error deleting IP');
    }
}
