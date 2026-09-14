'use strict';

/**
 * src/routes/students.routes.js
 *
 * All routes require authentication + registrar_admin role.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const studentsController = require('../controllers/students.controller');

const adminOnly = [auth, requireRole('registrar_admin')];

// POST /api/students — create student + issue QR token
router.post('/', ...adminOnly, studentsController.createStudent);

// GET /api/students — list/search students
router.get('/', ...adminOnly, studentsController.listStudents);

// PATCH /api/students/:id — update student fields
router.patch('/:id', ...adminOnly, studentsController.updateStudent);

// POST /api/students/lookup-by-qr — lookup student by raw QR token (admin only)
router.post('/lookup-by-qr', ...adminOnly, studentsController.lookupByQr);

// POST /api/students/:id/reissue-token — reissue additional QR token
router.post('/:id/reissue-token', ...adminOnly, studentsController.reissueToken);

// POST /api/students/:id/revoke-all-tokens — revoke all tokens for student
router.post('/:id/revoke-all-tokens', ...adminOnly, studentsController.revokeAllTokens);

module.exports = router;

