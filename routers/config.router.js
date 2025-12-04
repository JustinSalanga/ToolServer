const express = require('express');
const router = express.Router();
const {
    getAllConfigs,
    savePrompt,
    getPrompt,
    saveResume,
    getResume,
    saveTemplate,
    getTemplate,
    saveFolder,
    getFolder,
    getAllConfig,
    deleteConfig
} = require('../controllers/config.controller');

// All routes are public (no authentication required)

// Get all configs (must be before /:userEmail)
router.get('/all', getAllConfigs);

// Prompt routes
router.post('/prompt', savePrompt);
router.get('/prompt/:userEmail', getPrompt);

// Resume routes
router.post('/resume', saveResume);
router.get('/resume/:userEmail', getResume);

// Template routes
router.post('/template', saveTemplate);
router.get('/template/:userEmail', getTemplate);

// Folder routes
router.post('/folder', saveFolder);
router.get('/folder/:userEmail', getFolder);

// Get all config for specific user
router.get('/:userEmail', getAllConfig);

// Delete config for specific user
router.delete('/:userEmail', deleteConfig);

module.exports = router;
