'use strict';

/**
 * src/models/scanLog.model.js
 *
 * Append-only audit log of every scan attempt, successful or not.
 * No update or delete endpoints exist — this collection is effectively
 * immutable after insert.
 */

const mongoose = require('mongoose');

const SCAN_RESULTS = ['valid', 'invalid', 'expired', 'revoked', 'not_found'];

const scanLogSchema = new mongoose.Schema(
  {
    // Nullable: the student may not be resolvable if the token is completely bogus
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    // Always present: who scanned
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffUser',
      required: [true, 'Staff reference is required'],
    },
    // Human-readable tag provided by the scanning client (e.g. "Library Gate 1")
    locationTag: {
      type: String,
      trim: true,
      maxlength: [100, 'Location tag must not exceed 100 characters'],
      default: 'Unknown',
    },
    // Outcome of this scan attempt
    result: {
      type: String,
      required: [true, 'Scan result is required'],
      enum: {
        values: SCAN_RESULTS,
        message: `Result must be one of: ${SCAN_RESULTS.join(', ')}`,
      },
    },
    // Optionally store a redacted snapshot of what matric number was attempted
    matricNumberAttempted: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    // createdAt = scan timestamp; no updatedAt needed (append-only)
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Indexes to support log filtering
scanLogSchema.index({ result: 1, createdAt: -1 });
scanLogSchema.index({ student: 1, createdAt: -1 });
scanLogSchema.index({ staff: 1, createdAt: -1 });
scanLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
