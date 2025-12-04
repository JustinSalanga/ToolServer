const express = require('express');
const { 
    getAllowedEmails, 
    getAllowedEmail, 
    createAllowedEmail, 
    updateAllowedEmail, 
    deleteAllowedEmail 
} = require('../controllers/allowed-email.controller');
const { authenticateAdmin } = require('../utils/auth.middleware');
const router = express.Router();

// All allowed email routes require admin authentication
router.route('/')
    .get(authenticateAdmin, getAllowedEmails)
    .post(authenticateAdmin, createAllowedEmail);

router.route('/:id')
    .get(authenticateAdmin, getAllowedEmail)
    .put(authenticateAdmin, updateAllowedEmail)
    .delete(authenticateAdmin, deleteAllowedEmail);

module.exports = router;

