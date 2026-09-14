'use strict';

/**
 * src/controllers/students.controller.js
 *
 * HTTP adapter for student operations.
 * Controllers only: validate HTTP inputs → call service → shape HTTP response.
 * No Mongoose calls, no crypto calls, no business logic here.
 */

const studentService = require('../services/student.service');
const tokenService = require('../services/token.service');

/**
 * POST /api/students
 * Create a student and issue their first QR token.
 */
async function createStudent(req, res, next) {
  try {
    const { matricNumber, fullName, college, department, programLevel, validUntil, photoUrl, status, enrollmentStatus } = req.body;

    if (!matricNumber || !fullName || !department || !programLevel || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'matricNumber, fullName, department, programLevel, and validUntil are required.',
      });
    }

    if (isNaN(new Date(validUntil).getTime())) {
      return res.status(400).json({ success: false, message: 'validUntil must be a valid date string.' });
    }

    const result = await studentService.createStudent({
      matricNumber,
      fullName,
      college,
      department,
      programLevel,
      validUntil,
      photoUrl,
      status: status || enrollmentStatus || 'active',
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/students
 * List/search students with pagination.
 * Query params: search, status, department, page, limit
 */
async function listStudents(req, res, next) {
  try {
    const { search, status, enrollmentStatus, department, page, limit } = req.query;

    const result = await studentService.listStudents({
      search,
      status: status || enrollmentStatus,
      department,
      page,
      limit,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/students/:id
 * Update allowed fields on a student record.
 */
async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await studentService.updateStudent(id, req.body);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/students/:id/reissue-token
 * Issue an additional signed token + QR image without revoking existing tokens.
 */
async function reissueToken(req, res, next) {
  try {
    const { id } = req.params;

    const Student = require('../models/student.model');
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Purely additive reissue — do not call revoke
    const { tokenStr, qrImage, expiresAt } = await tokenService.issueTokenForStudent(student);

    return res.status(200).json({
      success: true,
      data: {
        student: studentService.sanitizeStudent(student),
        tokenStr,
        qrImage,
        tokenExpiresAt: expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/students/:id/revoke-all-tokens
 * Invalidate all tokens this student holds (e.g. card lost/stolen).
 */
async function revokeAllTokens(req, res, next) {
  try {
    const { id } = req.params;

    const Student = require('../models/student.model');
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await tokenService.revokeAllTokensForStudent(student);

    return res.status(200).json({
      success: true,
      message: 'All tokens for student have been revoked successfully.',
      data: {
        student: studentService.sanitizeStudent(student),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/students/lookup-by-qr
 * Look up a student record by raw scanned QR token string.
 * Succeeds even if token is expired or revoked.
 */
async function lookupByQr(req, res, next) {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ error: 'qrToken is required.' });
    }

    const { verifyQrPayload } = require('../utils/crypto');
    const verification = verifyQrPayload(qrToken);

    if (!verification.valid) {
      return res.status(404).json({ error: 'This QR code was not issued by this system' });
    }

    const Student = require('../models/student.model');
    const student = await Student.findOne({ matricNumber: verification.matricNumber });

    if (!student) {
      return res.status(404).json({ error: 'No student record matches this QR code' });
    }

    return res.status(200).json({
      student: studentService.sanitizeStudent(student),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createStudent, listStudents, updateStudent, reissueToken, revokeAllTokens, lookupByQr };
