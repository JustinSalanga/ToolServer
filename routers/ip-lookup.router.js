const express = require('express');
const { getUserByIP } = require('../controllers/auth.controller');
const router = express.Router();

// Public route to lookup user by IP address
router.route('/lookup/:ip')
    .get(getUserByIP);

module.exports = router;
