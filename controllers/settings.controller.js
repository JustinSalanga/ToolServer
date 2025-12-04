const model = require('../database/model');
const { handleError } = require('../utils/utils');
const { getClientIP } = require('../utils/ip.utils');

exports.getSettings = async (req, res) => {
    try {
        const settings = await model.getSettings();

        // Filter out sensitive settings (managed in dedicated pages)
        const hiddenKeys = ['openai_api_key', 'selected_gpt_model'];
        const visibleSettings = settings.filter(setting => !hiddenKeys.includes(setting.key));

        console.log(visibleSettings);

        res.status(200).json({
            settings: visibleSettings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        handleError(res, 500, 'Error fetching settings');
    }
}

exports.getSetting = async (req, res) => {
    const { id } = req.params;

    try {
        const setting = await model.getSettingById(id);

        if (!setting) {
            return handleError(res, 404, 'Setting not found');
        }

        res.status(200).json({
            setting
        });
    } catch (error) {
        console.error('Get setting error:', error);
        handleError(res, 500, 'Error fetching setting');
    }
}

exports.getSettingByKey = async (req, res) => {
    const { key } = req.params;

    try {
        const setting = await model.getSettingByKey(key);

        if (!setting) {
            return handleError(res, 404, 'Setting not found');
        }

        res.status(200).json({
            setting
        });
    } catch (error) {
        console.error('Get setting by key error:', error);
        handleError(res, 500, 'Error fetching setting');
    }
}

exports.createSetting = async (req, res) => {
    const { key, value } = req.body;

    try {
        if (!key || !value) {
            return handleError(res, 400, 'Key and value are required');
        }

        // Check if key already exists
        const existingSetting = await model.getSettingByKey(key);
        if (existingSetting) {
            return handleError(res, 400, 'Setting with this key already exists');
        }

        const newSetting = await model.createSetting(key, value);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'create',
            'setting',
            newSetting.id,
            `Setting created: ${key}`,
            clientIP,
            { key, value: value.substring(0, 100) } // Limit value length in metadata
        );

        res.status(201).json({
            message: 'Setting created successfully',
            setting: newSetting
        });
    } catch (error) {
        console.error('Create setting error:', error);
        handleError(res, 500, 'Error creating setting');
    }
}

exports.updateSetting = async (req, res) => {
    const { id } = req.params;
    const { key, value } = req.body;

    try {
        const existingSetting = await model.getSettingById(id);
        if (!existingSetting) {
            return handleError(res, 404, 'Setting not found');
        }

        // Prevent updating protected settings
        const protectedKeys = ['openai_api_key', 'selected_gpt_model'];
        if (protectedKeys.includes(existingSetting.key)) {
            return handleError(res, 403, 'This setting cannot be edited here. Please use the dedicated page.');
        }

        if (!key || !value) {
            return handleError(res, 400, 'Key and value are required');
        }

        // Check if new key is already taken by another setting
        if (key !== existingSetting.key) {
            const keyTaken = await model.getSettingByKey(key);
            if (keyTaken) {
                return handleError(res, 400, 'Key already in use');
            }
        }

        const updatedSetting = await model.updateSetting(id, key, value);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'update',
            'setting',
            id,
            `Setting updated: ${key}`,
            clientIP,
            { key, value: value.substring(0, 100) } // Limit value length in metadata
        );

        res.status(200).json({
            message: 'Setting updated successfully',
            setting: updatedSetting
        });
    } catch (error) {
        console.error('Update setting error:', error);
        handleError(res, 500, 'Error updating setting');
    }
}

exports.deleteSetting = async (req, res) => {
    const { id } = req.params;

    try {
        const setting = await model.getSettingById(id);
        if (!setting) {
            return handleError(res, 404, 'Setting not found');
        }

        // Prevent deleting protected settings
        const protectedKeys = ['openai_api_key', 'selected_gpt_model'];
        if (protectedKeys.includes(setting.key)) {
            return handleError(res, 403, 'This setting cannot be deleted here. Please use the dedicated page.');
        }

        await model.deleteSetting(id);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail,
            'delete',
            'setting',
            id,
            `Setting deleted: ${setting.key}`,
            clientIP,
            { key: setting.key }
        );

        res.status(200).json({
            message: 'Setting deleted successfully'
        });
    } catch (error) {
        console.error('Delete setting error:', error);
        handleError(res, 500, 'Error deleting setting');
    }
}
