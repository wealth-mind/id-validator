'use strict';

/**
 * src/routes/location.routes.js
 *
 * Routing for checkpoint locations.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const locationController = require('../controllers/location.controller');

const adminOnly = [auth, requireRole('registrar_admin')];

// GET /api/locations — any authenticated staff role
router.get('/', auth, locationController.getLocations);

// POST /api/locations — registrar_admin only
router.post('/', ...adminOnly, locationController.createLocation);

// PATCH /api/locations/:id — registrar_admin only
router.patch('/:id', ...adminOnly, locationController.updateLocation);

module.exports = router;
