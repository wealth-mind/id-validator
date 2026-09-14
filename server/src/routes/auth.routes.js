'use strict';

/**
 * src/routes/auth.routes.js
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// TODO: Add rate limiting to these endpoints (e.g. express-rate-limit)
// Recommended: 5 attempts per minute per IP for /login

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

module.exports = router;
