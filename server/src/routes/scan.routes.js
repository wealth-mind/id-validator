'use strict';

/**
 * src/routes/scan.routes.js
 *
 * Accessible by all authenticated staff roles.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const scanController = require('../controllers/scan.controller');

// All valid roles may scan
const allRoles = ['security', 'library', 'exam_invigilator', 'registrar_admin'];

// TODO: Add rate limiting to this endpoint
// Recommended: 60 scans per minute per authenticated staff member

// POST /api/scan/validate
router.post('/validate', auth, requireRole(...allRoles), scanController.validateScan);

module.exports = router;
