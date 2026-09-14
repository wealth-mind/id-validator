'use strict';

/**
 * src/controllers/scan.controller.js
 *
 * Handles QR code scan validation requests.
 *
 * Critical guarantee: every scan attempt — valid or not — is logged before
 * returning a response. The audit log call is fire-and-forget but must
 * not prevent the response from being sent.
 */

const tokenService = require('../services/token.service');
const auditService = require('../services/audit.service');

/**
 * POST /api/scan/validate
 * Body: { token?, matricNumber?, locationTag? }
 *
 * The server NEVER trusts a client-submitted validity flag.
 * Verification is always performed server-side.
 */
async function validateScan(req, res, next) {
  try {
    const { token, matricNumber, locationTag } = req.body;

    const hasToken = typeof token === 'string' && token.trim() !== '';
    const hasMatricNumber = typeof matricNumber === 'string' && matricNumber.trim() !== '';

    if (!hasToken && !hasMatricNumber) {
      return res.status(400).json({
        success: false,
        message: 'Either token (scanned QR string) or matricNumber is required.',
      });
    }

    const staffId = req.staff.id;
    const isManual = hasMatricNumber && !hasToken;

    let result;
    let student;
    let matricNumberAttempted;

    if (isManual) {
      ({ result, student, matricNumberAttempted } = await tokenService.validateMatricNumber(matricNumber.trim()));
    } else {
      // Full 6-step validation chain (HMAC → expiry → lookup → hash → revocation → enrollment)
      ({ result, student, matricNumberAttempted } = await tokenService.validateScannedToken(token.trim()));
    }

    // Log every attempt — fire and forget (errors are caught inside logScan)
    await auditService.logScan({
      studentId: student ? student._id.toString() : null,
      staffId,
      locationTag: locationTag || 'Unknown',
      result,
      matricNumberAttempted,
    });

    const method = isManual ? 'manual_entry' : 'qr_scan';

    if (result === 'valid') {
      return res.status(200).json({
        success: true,
        result: 'valid',
        method,
        data: {
          student: {
            id: student._id,
            matricNumber: student.matricNumber,
            fullName: student.fullName,
            college: student.college || '—',
            department: student.department,
            programLevel: student.programLevel,
            status: student.status || student.enrollmentStatus || 'active',
            photoUrl: student.photoUrl,
            validUntil: student.validUntil,
          },
        },
      });
    }

    // For all failure cases: return result code and appropriate HTTP status
    // 200 is used for expected scan outcomes (client needs to read `result` field)
    const statusMap = {
      invalid: 200,
      expired: 200,
      revoked: 200,
      not_found: 200,
    };

    return res.status(statusMap[result] || 200).json({
      success: false,
      result,
      method,
      message: getScanResultMessage(result),
    });
  } catch (err) {
    next(err);
  }
}

function getScanResultMessage(result) {
  const messages = {
    invalid: 'ID is invalid, inactive, or has been tampered with.',
    expired: 'ID or enrollment period has expired.',
    revoked: 'This ID has been revoked. A replacement must be issued.',
    not_found: 'No student found for this record.',
  };
  return messages[result] || 'Validation failed.';
}

module.exports = { validateScan };
