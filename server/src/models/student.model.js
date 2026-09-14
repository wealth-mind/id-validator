'use strict';

/**
 * src/models/student.model.js
 *
 * Represents a registered student in the system.
 *
 * currentToken sub-document stores only the SHA-256 hash of the currently
 * valid QR token — never the plaintext token — so a reissued token can be
 * detected on scan without storing the secret.
 */

const mongoose = require('mongoose');

const ENROLLMENT_STATUSES = ['active', 'inactive', 'suspended', 'graduated', 'withdrawn'];
const PROGRAM_LEVELS = ['undergraduate', 'postgraduate', 'diploma', 'phd'];

const tokenSubSchema = new mongoose.Schema(
  {
    encodedToken: {
      type: String,
      default: null,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    matricNumber: {
      type: String,
      required: [true, 'Matric number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [30, 'Matric number must not exceed 30 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name must not exceed 120 characters'],
    },
    college: {
      type: String,
      trim: true,
      maxlength: [100, 'College name must not exceed 100 characters'],
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department name must not exceed 100 characters'],
    },
    programLevel: {
      type: String,
      required: [true, 'Program level is required'],
      enum: {
        values: PROGRAM_LEVELS,
        message: `Program level must be one of: ${PROGRAM_LEVELS.join(', ')}`,
      },
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ENROLLMENT_STATUSES,
        message: `Status must be one of: ${ENROLLMENT_STATUSES.join(', ')}`,
      },
      default: 'active',
    },
    // The date through which this student's enrollment is valid (e.g. end of current semester)
    validUntil: {
      type: Date,
      required: [true, 'validUntil date is required'],
    },
    // Array of issued tokens — supports multiple simultaneously valid QR codes
    tokens: {
      type: [tokenSubSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

studentSchema.index({ status: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ fullName: 'text' }); // full-text search support

module.exports = mongoose.model('Student', studentSchema);
