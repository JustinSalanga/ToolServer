const express = require('express');
const { login, getUsers, getUser, updateUser, register, deleteUser, toggleBlock, verify } = require('../controllers/auth.controller');
const { validateLogin, validateRegister, authenticate, authenticateAdmin } = require('../utils/auth.middleware');
const router = express.Router();

// Public routes (no authentication required)
router.route('/signup')
    .post(validateRegister, register);

router.route('/login')
    .post(validateLogin, login);

// Token verification route (requires authentication)
router.route('/verify')
    .get(authenticate, verify);

// Protected routes (admin authentication required)
router.route('/')
    .get(authenticateAdmin, getUsers);

router.route('/:id')
    .get(authenticateAdmin, getUser)
    .put(authenticateAdmin, updateUser)
    .delete(authenticateAdmin, deleteUser);

router.route('/:id/block')
    .patch(authenticateAdmin, toggleBlock);

module.exports = router;