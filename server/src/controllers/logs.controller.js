'use strict';

/**
 * src/controllers/logs.controller.js
 *
 * Retrieves audit scan logs with filtering and pagination.
 */

const auditService = require('../services/audit.service');

/**
 * GET /api/logs
 * Query params: result, dateFrom, dateTo, staffId, studentId, page, limit
 */
async function getLogs(req, res, next) {
  try {
    const { result, dateFrom, dateTo, staffId, studentId, page, limit } = req.query;

    // Basic date validation
    if (dateFrom && isNaN(new Date(dateFrom).getTime())) {
      return res.status(400).json({ success: false, message: 'dateFrom must be a valid date string.' });
    }
    if (dateTo && isNaN(new Date(dateTo).getTime())) {
      return res.status(400).json({ success: false, message: 'dateTo must be a valid date string.' });
    }

    const logsResult = await auditService.getLogs({
      result,
      dateFrom,
      dateTo,
      staffId,
      studentId,
      page,
      limit,
    });

    return res.status(200).json({ success: true, ...logsResult });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLogs };
