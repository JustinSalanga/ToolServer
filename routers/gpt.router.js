const express = require('express');
const { getAvailableModels, getSelectedModel, setSelectedModel, getApiKey, saveApiKey } = require('../controllers/gpt.controller');
const { authenticate } = require('../utils/auth.middleware');
const router = express.Router();

// All GPT model routes require authentication
router.route('/models')
    .get(authenticate, getAvailableModels);

router.route('/selected')
    .get(authenticate, getSelectedModel)
    .post(authenticate, setSelectedModel);

router.route('/apikey')
    .get(authenticate, getApiKey)
    .post(authenticate, saveApiKey);

module.exports = router;
