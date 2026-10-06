'use strict';

/**
 * src/services/audit.service.js
 *
 * Append-only scan log operations.
 * Logs are never deleted or updated through this service.
 */

const ScanLog = require('../models/scanLog.model');

/**
 * Record a scan attempt.
 *
 * @param {object} params
 * @param {string|null}          params.studentId           - ObjectId of resolved student, or null
 * @param {string}               params.staffId             - ObjectId of scanning staff
 * @param {string}               [params.locationTag]       - e.g. "Library Gate 1"
 * @param {'valid'|'invalid'|'expired'|'revoked'|'not_found'} params.result
 * @param {string|null}          [params.matricNumberAttempted] - matric number decoded from token (for audit trail even when student not found)
 * @returns {Promise<void>}
 */
async function logScan({ studentId, staffId, locationTag, result, matricNumberAttempted }) {
  try {
    await ScanLog.create({
      student: studentId || null,
      staff: staffId,
      locationTag: locationTag || 'Unknown',
      result,
      matricNumberAttempted: matricNumberAttempted || null,
    });
  } catch (err) {
    // Logging must never crash the main scan response — just warn
    console.error('[audit] Failed to write scan log:', err.message);
  }
}

/**
 * Retrieve paginated scan logs with optional filters.
 *
 * @param {object} options
 * @param {string}  [options.result]    - filter by result enum value
 * @param {string}  [options.dateFrom]  - ISO date string, inclusive start
 * @param {string}  [options.dateTo]    - ISO date string, inclusive end
 * @param {string}  [options.staffId]   - filter by staff ObjectId
 * @param {string}  [options.studentId] - filter by student ObjectId
 * @param {number}  [options.page=1]
 * @param {number}  [options.limit=50]
 * @returns {Promise<{ data: object[], total: number, page: number, totalPages: number }>}
 */
async function getLogs({ result, dateFrom, dateTo, staffId, studentId, locationTag, page = 1, limit = 50 } = {}) {
  const filter = {};

  if (result) {
    filter.result = result;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      // Include the entire dateTo day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (staffId) {
    filter.staff = staffId;
  }

  if (studentId) {
    filter.student = studentId;
  }

  if (locationTag) {
    filter.locationTag = locationTag;
  }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    ScanLog.find(filter)
      .populate('student', 'matricNumber fullName department')
      .populate('staff', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    ScanLog.countDocuments(filter),
  ]);

  return {
    data: logs,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

module.exports = { logScan, getLogs };
