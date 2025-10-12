const express = require('express');
const { login, getUsers, getUser, updateUser, register, deleteUser, toggleBlock, verify } = require('../controllers/auth.controller');
const { validateLogin, validateRegister, authenticate } = require('../utils/auth.middleware');
const router = express.Router();

// Public routes (no authentication required)
router.route('/signup')
    .post(validateRegister, register);

router.route('/login')
    .post(validateLogin, login);

// Token verification route (requires authentication)
router.route('/verify')
    .get(authenticate, verify);

// Protected routes (authentication required)
router.route('/')
    .get(authenticate, getUsers);

router.route('/:id')
    .get(authenticate, getUser)
    .put(authenticate, updateUser)
    .delete(authenticate, deleteUser);

router.route('/:id/block')
    .patch(authenticate, toggleBlock);

module.exports = router;