const express = require('express');
const { getHistoryLogs, getHistoryLog } = require('../controllers/history.controller');
const { authenticateAdmin } = require('../utils/auth.middleware');
const router = express.Router();

// History routes require admin authentication
router.route('/')
    .get(authenticateAdmin, getHistoryLogs);

router.route('/:id')
    .get(authenticateAdmin, getHistoryLog);

module.exports = router;

