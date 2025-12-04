const model = require('../database/model');
const { handleError } = require('../utils/utils');
const { getClientIP } = require('../utils/ip.utils');

exports.getBlockListItems = async (req, res) => {
    try {
        const items = await model.getAllBlockListItems();
        res.status(200).json({
            items
        });
    } catch (error) {
        console.error('Get block list items error:', error);
        handleError(res, 500, 'Error fetching block list items');
    }
}

exports.getBlockListItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await model.getBlockListItemById(id);

        if (!item) {
            return handleError(res, 404, 'Block list item not found');
        }

        res.status(200).json({
            item
        });
    } catch (error) {
        console.error('Get block list item error:', error);
        handleError(res, 500, 'Error fetching block list item');
    }
}

exports.createBlockListItem = async (req, res) => {
    const { company_name, url } = req.body;

    // Validate that at least one field is provided
    if (!company_name && !url) {
        return handleError(res, 400, 'Either company_name or url must be provided');
    }

    try {
        const newItem = await model.createBlockListItem(company_name, url);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'create',
            'block_list',
            newItem.id,
            `Block list item created: ${company_name || url}`,
            clientIP,
            { company_name, url }
        );

        return res.status(201).json({
            message: 'Block list item created successfully',
            item: newItem
        });
    } catch (error) {
        console.error('Create block list item error:', error);
        handleError(res, 500, 'Error creating block list item');
    }
}

exports.updateBlockListItem = async (req, res) => {
    const { id } = req.params;
    const { company_name, url } = req.body;

    try {
        // Check if item exists
        const existingItem = await model.getBlockListItemById(id);
        if (!existingItem) {
            return handleError(res, 404, 'Block list item not found');
        }

        // Validate that at least one field is provided
        if (!company_name && !url) {
            return handleError(res, 400, 'Either company_name or url must be provided');
        }

        // Update item
        const updatedItem = await model.updateBlockListItem(id, company_name, url);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'update',
            'block_list',
            id,
            `Block list item updated: ${company_name || url}`,
            clientIP,
            { company_name, url }
        );

        res.status(200).json({
            message: 'Block list item updated successfully',
            item: updatedItem
        });
    } catch (error) {
        console.error('Update block list item error:', error);
        handleError(res, 500, 'Error updating block list item');
    }
}

exports.deleteBlockListItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await model.getBlockListItemById(id);
        if (!item) {
            return handleError(res, 404, 'Block list item not found');
        }

        await model.deleteBlockListItem(id);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'delete',
            'block_list',
            id,
            `Block list item deleted: ${item.company_name || item.url}`,
            clientIP,
            { company_name: item.company_name, url: item.url }
        );

        res.status(200).json({
            message: 'Block list item deleted successfully'
        });
    } catch (error) {
        console.error('Delete block list item error:', error);
        handleError(res, 500, 'Error deleting block list item');
    }
}

