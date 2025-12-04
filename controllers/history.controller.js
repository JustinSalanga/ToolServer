const model = require('../database/model');
const { handleError } = require('../utils/utils');

exports.getHistoryLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, user_id, action_type, entity_type } = req.query;
        const result = await model.getHistoryLogs(page, limit, user_id, action_type, entity_type);

        res.status(200).json({
            logs: result.logs,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get history logs error:', error);
        handleError(res, 500, 'Error fetching history logs');
    }
}

exports.getHistoryLog = async (req, res) => {
    const { id } = req.params;

    try {
        const log = await model.getHistoryLogById(id);

        if (!log) {
            return handleError(res, 404, 'History log not found');
        }

        res.status(200).json({
            log
        });
    } catch (error) {
        console.error('Get history log error:', error);
        handleError(res, 500, 'Error fetching history log');
    }
}

