'use strict';

/**
 * src/routes/logs.routes.js
 *
 * Audit log access — registrar_admin only.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const logsController = require('../controllers/logs.controller');

// GET /api/logs
router.get('/', auth, requireRole('registrar_admin'), logsController.getLogs);

module.exports = router;
