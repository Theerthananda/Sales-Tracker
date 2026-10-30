const express = require('express');
const { login, logout, register } = require('../controllers/authController');
const { limiter } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply rate limiting to auth routes to prevent brute force attacks

router.post('/login', limiter, login);
router.post('/logout', logout);
router.post('/register', limiter, register);

module.exports = router;
