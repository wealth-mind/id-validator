'use strict';

/**
 * src/models/staffUser.model.js
 *
 * Represents a staff account that can log in to the system.
 * Passwords are stored as bcrypt hashes — never plaintext.
 */

const mongoose = require('mongoose');

const ROLES = ['security', 'library', 'exam_invigilator', 'registrar_admin'];

const staffUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name must not exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ROLES,
        message: `Role must be one of: ${ROLES.join(', ')}`,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

staffUserSchema.index({ role: 1 });

module.exports = mongoose.model('StaffUser', staffUserSchema);
