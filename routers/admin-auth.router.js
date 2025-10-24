const express = require('express');
const { adminLogin, adminRegister, adminVerify } = require('../controllers/admin-auth.controller');
const { validateLogin, validateRegister, authenticateAdmin } = require('../utils/auth.middleware');
const router = express.Router();

// Admin authentication routes
router.route('/login')
    .post(validateLogin, adminLogin);

router.route('/register')
    .post(validateRegister, adminRegister);

// Admin token verification route (requires admin authentication)
router.route('/verify')
    .get(authenticateAdmin, adminVerify);

module.exports = router;
