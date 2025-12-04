const model = require('../database/model');
const { handleError } = require('../utils/utils');
const { getClientIP } = require('../utils/ip.utils');

// Get all configurations
exports.getAllConfigs = async (req, res) => {
    try {
        const configs = await model.getAllConfigs();

        res.status(200).json({
            configs
        });
    } catch (error) {
        console.error('Get all configs error:', error);
        handleError(res, 500, 'Error fetching all configurations');
    }
}

// Save prompt for user
exports.savePrompt = async (req, res) => {
    const { user_email, prompt } = req.body;

    try {
        if (!user_email || !prompt) {
            return handleError(res, 400, 'User email and prompt are required');
        }

        const existingConfig = await model.getConfigByEmail(user_email);
        const config = await model.savePrompt(user_email, prompt);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail || user_email,
            existingConfig ? 'update' : 'create',
            'config',
            config.id,
            `${existingConfig ? 'Prompt updated' : 'Prompt saved'} for user: ${user_email}`,
            clientIP,
            { user_email, field: 'prompt' }
        );

        res.status(200).json({
            message: 'Prompt saved successfully',
            config
        });
    } catch (error) {
        console.error('Save prompt error:', error);
        handleError(res, 500, 'Error saving prompt');
    }
}

// Get prompt for user
exports.getPrompt = async (req, res) => {
    const { userEmail } = req.params;

    try {
        const config = await model.getConfigByEmail(userEmail);

        if (!config) {
            return res.status(200).json({
                prompt: null,
                message: 'No configuration found for this user'
            });
        }

        res.status(200).json({
            prompt: config.prompt
        });
    } catch (error) {
        console.error('Get prompt error:', error);
        handleError(res, 500, 'Error fetching prompt');
    }
}

// Save resume for user
exports.saveResume = async (req, res) => {
    const { user_email, resume } = req.body;

    try {
        if (!user_email || !resume) {
            return handleError(res, 400, 'User email and resume are required');
        }

        const existingConfig = await model.getConfigByEmail(user_email);
        const config = await model.saveResume(user_email, resume);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail || user_email,
            existingConfig ? 'update' : 'create',
            'config',
            config.id,
            `${existingConfig ? 'Resume updated' : 'Resume saved'} for user: ${user_email}`,
            clientIP,
            { user_email, field: 'resume' }
        );

        res.status(200).json({
            message: 'Resume saved successfully',
            config
        });
    } catch (error) {
        console.error('Save resume error:', error);
        handleError(res, 500, 'Error saving resume');
    }
}

// Get resume for user
exports.getResume = async (req, res) => {
    const { userEmail } = req.params;

    try {
        const config = await model.getConfigByEmail(userEmail);

        if (!config) {
            return res.status(200).json({
                resume: null,
                message: 'No configuration found for this user'
            });
        }

        res.status(200).json({
            resume: config.resume
        });
    } catch (error) {
        console.error('Get resume error:', error);
        handleError(res, 500, 'Error fetching resume');
    }
}

// Save template path for user
exports.saveTemplate = async (req, res) => {
    const { user_email, template_path } = req.body;

    try {
        if (!user_email || !template_path) {
            return handleError(res, 400, 'User email and template path are required');
        }

        const existingConfig = await model.getConfigByEmail(user_email);
        const config = await model.saveTemplate(user_email, template_path);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail || user_email,
            existingConfig ? 'update' : 'create',
            'config',
            config.id,
            `${existingConfig ? 'Template path updated' : 'Template path saved'} for user: ${user_email}`,
            clientIP,
            { user_email, field: 'template_path', template_path }
        );

        res.status(200).json({
            message: 'Template path saved successfully',
            config
        });
    } catch (error) {
        console.error('Save template error:', error);
        handleError(res, 500, 'Error saving template path');
    }
}

// Get template path for user
exports.getTemplate = async (req, res) => {
    const { userEmail } = req.params;

    try {
        const config = await model.getConfigByEmail(userEmail);

        if (!config) {
            return res.status(200).json({
                template_path: null,
                message: 'No configuration found for this user'
            });
        }

        res.status(200).json({
            template_path: config.template_path
        });
    } catch (error) {
        console.error('Get template error:', error);
        handleError(res, 500, 'Error fetching template path');
    }
}

// Save folder path for user
exports.saveFolder = async (req, res) => {
    const { user_email, folder_path } = req.body;

    try {
        if (!user_email || !folder_path) {
            return handleError(res, 400, 'User email and folder path are required');
        }

        const existingConfig = await model.getConfigByEmail(user_email);
        const config = await model.saveFolder(user_email, folder_path);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmail || user_email,
            existingConfig ? 'update' : 'create',
            'config',
            config.id,
            `${existingConfig ? 'Folder path updated' : 'Folder path saved'} for user: ${user_email}`,
            clientIP,
            { user_email, field: 'folder_path', folder_path }
        );

        res.status(200).json({
            message: 'Folder path saved successfully',
            config
        });
    } catch (error) {
        console.error('Save folder error:', error);
        handleError(res, 500, 'Error saving folder path');
    }
}

// Get folder path for user
exports.getFolder = async (req, res) => {
    const { userEmail } = req.params;

    try {
        const config = await model.getConfigByEmail(userEmail);

        if (!config) {
            return res.status(200).json({
                folder_path: null,
                message: 'No configuration found for this user'
            });
        }

        res.status(200).json({
            folder_path: config.folder_path
        });
    } catch (error) {
        console.error('Get folder error:', error);
        handleError(res, 500, 'Error fetching folder path');
    }
}

// Get all configuration for user
exports.getAllConfig = async (req, res) => {
    const { userEmail } = req.params;

    try {
        const config = await model.getConfigByEmail(userEmail);

        if (!config) {
            return res.status(200).json({
                config: {
                    prompt: null,
                    resume: null,
                    template_path: null,
                    folder_path: null
                },
                message: 'No configuration found for this user'
            });
        }

        res.status(200).json({
            config: {
                prompt: config.prompt,
                resume: config.resume,
                template_path: config.template_path,
                folder_path: config.folder_path,
                created_at: config.created_at,
                updated_at: config.updated_at
            }
        });
    } catch (error) {
        console.error('Get all config error:', error);
        handleError(res, 500, 'Error fetching configuration');
    }
}

// Delete configuration for user
exports.deleteConfig = async (req, res) => {
    const { userEmail } = req.params;

    try {
        const config = await model.getConfigByEmail(userEmail);
        if (!config) {
            return handleError(res, 404, 'Configuration not found for this user');
        }

        await model.deleteConfig(userEmail);

        // Log history
        const userId = req.user ? req.user.id : null;
        const userEmailFromReq = req.user ? req.user.email : null;
        const clientIP = getClientIP(req);
        await model.createHistoryLog(
            userId,
            userEmailFromReq || userEmail,
            'delete',
            'config',
            config.id,
            `User configuration deleted: ${userEmail}`,
            clientIP,
            { user_email: userEmail }
        );

        res.status(200).json({
            message: 'Configuration deleted successfully'
        });
    } catch (error) {
        console.error('Delete config error:', error);
        handleError(res, 500, 'Error deleting configuration');
    }
}
