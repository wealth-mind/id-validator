'use strict';

/**
 * src/models/location.model.js
 *
 * Checkpoint location collection for ID card scanning stations.
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Location name must not exceed 100 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

locationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Location', locationSchema);
