const express = require('express');
const { getSettings, getSetting, getSettingByKey, createSetting, updateSetting, deleteSetting } = require('../controllers/settings.controller');
const { authenticate } = require('../utils/auth.middleware');
const router = express.Router();

// All settings routes require authentication
router.route('/')
    .get(authenticate, getSettings)
    .post(authenticate, createSetting);

router.route('/key/:key')
    .get(authenticate, getSettingByKey);

router.route('/:id')
    .get(authenticate, getSetting)
    .put(authenticate, updateSetting)
    .delete(authenticate, deleteSetting);

module.exports = router;
