'use strict';

/**
 * src/controllers/location.controller.js
 *
 * Location management controller.
 */

const Location = require('../models/location.model');

const DEFAULT_LOCATIONS = [
  'Main Gate',
  'North Gate',
  'Library',
  'Exam Hall A',
  'Exam Hall B',
  'Science Complex',
  'Admin Block',
  'Student Center',
];

/**
 * GET /api/locations
 * Query: includeInactive=true
 * Returns: { locations: [{ _id, name, isActive }] }
 */
async function getLocations(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    // Auto-seed presets if collection is empty on first run
    const count = await Location.countDocuments();
    if (count === 0) {
      await Location.insertMany(
        DEFAULT_LOCATIONS.map((name) => ({ name, isActive: true })),
        { ordered: false }
      ).catch(() => {});
    }

    const filter = includeInactive ? {} : { isActive: true };
    const locations = await Location.find(filter).sort({ name: 1 }).lean();

    return res.status(200).json({
      success: true,
      locations,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/locations
 * Body: { name }
 * Returns: { location }
 */
async function createLocation(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location name is required.',
      });
    }

    const trimmed = name.trim();

    // Case-insensitive check for duplicate name
    const existing = await Location.findOne({
      name: { $regex: new RegExp(`^${trimmed}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Location '${trimmed}' already exists.`,
      });
    }

    const location = await Location.create({ name: trimmed, isActive: true });

    return res.status(201).json({
      success: true,
      location,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Location name already exists.',
      });
    }
    next(err);
  }
}

/**
 * PATCH /api/locations/:id
 * Body: { name?, isActive? }
 * Returns: { location }
 */
async function updateLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found.',
      });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Location name cannot be empty.',
        });
      }

      const trimmed = name.trim();
      // Check if another location already uses this name
      const duplicate = await Location.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmed}$`, 'i') },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Location '${trimmed}' already exists.`,
        });
      }

      location.name = trimmed;
    }

    if (isActive !== undefined) {
      location.isActive = Boolean(isActive);
    }

    await location.save();

    return res.status(200).json({
      success: true,
      location,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Location name already exists.',
      });
    }
    next(err);
  }
}

module.exports = {
  getLocations,
  createLocation,
  updateLocation,
};
