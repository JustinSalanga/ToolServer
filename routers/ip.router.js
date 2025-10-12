const express = require('express');
const { getIPs, getIP, getIPsByUser, getUserByIP, createIP, updateIP, deleteIP } = require('../controllers/ip.controller');
const { authenticate } = require('../utils/auth.middleware');
const router = express.Router();

// All IP routes require authentication
router.route('/')
    .get(authenticate, getIPs)
    .post(authenticate, createIP);

router.route('/user/:userId')
    .get(authenticate, getIPsByUser);

router.route('/lookup/:ip')
    .get(getUserByIP);

router.route('/:id')
    .get(authenticate, getIP)
    .put(authenticate, updateIP)
    .delete(authenticate, deleteIP);

module.exports = router;
