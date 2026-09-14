'use strict';

/**
 * src/services/token.service.js
 *
 * Business logic for QR token lifecycle:
 *   - Issuing a new signed token for a student (pushed onto student.tokens)
 *   - Validating a scanned token end-to-end against student.tokens
 *   - Validating a student by matric number (manual fallback path)
 *   - Revoking a specific token by hash
 *   - Revoking all tokens for a student
 *
 * This is the ONLY layer that touches the crypto utilities and student model
 * for token operations. Controllers must NOT call crypto.js directly.
 */

const Student = require('../models/student.model');
const { signQrPayload, verifyQrPayload, hashToken } = require('../utils/crypto');
const { generateQrImage } = require('../utils/qrImage');

const QR_TOKEN_VALID_DAYS = parseInt(process.env.QR_TOKEN_VALID_DAYS || '365', 10);

/**
 * Issue a new signed QR token for a student.
 * Pushes the SHA-256 hash and metadata into student.tokens — never overwriting existing entries.
 *
 * @param {mongoose.Document} student - the student Mongoose document
 * @returns {Promise<{ tokenStr: string, qrImage: string, expiresAt: Date }>}
 */
async function issueTokenForStudent(student) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setDate(expiresAt.getDate() + QR_TOKEN_VALID_DAYS);

  const tokenStr = signQrPayload(student.matricNumber, expiresAt);
  const tokenHash = hashToken(tokenStr);
  const qrImage = await generateQrImage(tokenStr);

  if (!student.tokens) {
    student.tokens = [];
  }

  // Preserve legacy currentToken if present and not yet in tokens
  if (student.currentToken && student.currentToken.tokenHash && !student.tokens.some((t) => t.tokenHash === student.currentToken.tokenHash)) {
    student.tokens.push({
      tokenHash: student.currentToken.tokenHash,
      issuedAt: student.currentToken.issuedAt || new Date(),
      expiresAt: student.currentToken.expiresAt || expiresAt,
      revoked: Boolean(student.currentToken.revoked),
    });
  }

  student.tokens.push({
    tokenHash,
    issuedAt,
    expiresAt,
    revoked: false,
  });

  await student.save();

  return { tokenStr, qrImage, expiresAt };
}

/**
 * Validate a scanned QR token string through the full security chain:
 *  1. HMAC signature
 *  2. Expiry (from token payload)
 *  3. Student lookup by matric number
 *  4. Token hash match in student.tokens array
 *  5. Revocation flag on matching token entry
 *  6. Enrollment status and validUntil date
 *
 * Returns a structured result — does NOT throw for expected failure cases,
 * so the caller (scan controller) can log every outcome consistently.
 *
 * @param {string} tokenStr - raw base64url string from the scanner (encodedToken)
 * @returns {Promise<{
 *   result: 'valid'|'invalid'|'expired'|'revoked'|'not_found',
 *   student?: mongoose.Document,
 *   matricNumberAttempted?: string,
 * }>}
 */
async function validateScannedToken(tokenStr) {
  // Step 1 & 2: Verify HMAC signature (timingSafeEqual inside verifyQrPayload)
  const verification = verifyQrPayload(tokenStr);

  if (!verification.valid) {
    // invalid_format or invalid_signature
    return { result: 'invalid', student: null, matricNumberAttempted: null };
  }

  const { matricNumber, expiresAt } = verification;

  // Step 2: Check expiry (verifyQrPayload already decoded, we re-check here authoritatively)
  if (new Date() > new Date(expiresAt)) {
    return { result: 'expired', student: null, matricNumberAttempted: matricNumber };
  }

  // Step 3: Student lookup
  const student = await Student.findOne({ matricNumber });
  if (!student) {
    return { result: 'not_found', student: null, matricNumberAttempted: matricNumber };
  }

  // Step 4: Token hash lookup in student.tokens (with legacy currentToken fallback)
  const presentedHash = hashToken(tokenStr);
  const allTokens = [...(student.tokens || [])];
  if (student.currentToken && student.currentToken.tokenHash && !allTokens.some((t) => t.tokenHash === student.currentToken.tokenHash)) {
    allTokens.push(student.currentToken);
  }

  const matchingToken = allTokens.find((t) => t.tokenHash === presentedHash);

  if (!matchingToken) {
    // Token is unknown to this student record
    return { result: 'invalid', student, matricNumberAttempted: matricNumber };
  }

  // Step 5: Revocation check on the matching token
  if (matchingToken.revoked) {
    return { result: 'revoked', student, matricNumberAttempted: matricNumber };
  }

  // Check matching token expiration
  if (matchingToken.expiresAt && new Date() > new Date(matchingToken.expiresAt)) {
    return { result: 'expired', student, matricNumberAttempted: matricNumber };
  }

  // Step 6: Status and validUntil
  const currentStatus = student.status || student.enrollmentStatus;
  if (currentStatus !== 'active') {
    return { result: 'invalid', student, matricNumberAttempted: matricNumber };
  }

  if (new Date() > new Date(student.validUntil)) {
    return { result: 'expired', student, matricNumberAttempted: matricNumber };
  }

  return { result: 'valid', student, matricNumberAttempted: matricNumber };
}

/**
 * Revoke exactly one token for a student by its SHA-256 hash.
 * Leaves all other tokens for the student untouched.
 *
 * @param {mongoose.Document} student
 * @param {string} tokenHash
 * @returns {Promise<void>}
 */
async function revokeTokenByHash(student, tokenHash) {
  let changed = false;
  if (student.currentToken && student.currentToken.tokenHash === tokenHash) {
    student.currentToken.revoked = true;
    changed = true;
  }
  if (student.tokens && Array.isArray(student.tokens)) {
    const token = student.tokens.find((t) => t.tokenHash === tokenHash);
    if (token) {
      token.revoked = true;
      changed = true;
    }
  }
  if (changed) {
    await student.save();
  }
}

/**
 * Revoke all tokens for a student (blanket revocation).
 * Sets revoked = true on every token the student holds.
 *
 * @param {mongoose.Document} student
 * @returns {Promise<void>}
 */
async function revokeAllTokensForStudent(student) {
  if (student.currentToken) {
    student.currentToken.revoked = true;
  }
  if (student.tokens && Array.isArray(student.tokens)) {
    student.tokens.forEach((t) => {
      t.revoked = true;
    });
  }
  await student.save();
}

/**
 * Validate a student record directly by matric number (manual fallback path).
 * A student is valid if they have AT LEAST ONE non-revoked token in their tokens array.
 *
 * @param {string} matricNumber
 * @returns {Promise<{
 *   result: 'valid'|'invalid'|'expired'|'revoked'|'not_found',
 *   student?: mongoose.Document,
 *   matricNumberAttempted: string,
 * }>}
 */
async function validateByMatricNumber(matricNumber) {
  if (!matricNumber || typeof matricNumber !== 'string') {
    return { result: 'invalid', student: null, matricNumberAttempted: null };
  }

  const cleanMatric = matricNumber.trim().toUpperCase();
  const student = await Student.findOne({ matricNumber: cleanMatric });
  if (!student) {
    return { result: 'not_found', student: null, matricNumberAttempted: cleanMatric };
  }

  // Step 1: Check token presence and non-revocation (including legacy currentToken)
  const tokens = [...(student.tokens || [])];
  if (student.currentToken && student.currentToken.tokenHash && !tokens.some((t) => t.tokenHash === student.currentToken.tokenHash)) {
    tokens.push(student.currentToken);
  }

  if (tokens.length === 0) {
    return { result: 'invalid', student, matricNumberAttempted: cleanMatric };
  }

  const hasNonRevoked = tokens.some((t) => !t.revoked);
  if (!hasNonRevoked) {
    return { result: 'revoked', student, matricNumberAttempted: cleanMatric };
  }

  // Step 2: Status check
  const manualStatus = student.status || student.enrollmentStatus;
  if (manualStatus !== 'active') {
    return { result: 'invalid', student, matricNumberAttempted: cleanMatric };
  }

  // Step 3: Valid until date check
  if (new Date() > new Date(student.validUntil)) {
    return { result: 'expired', student, matricNumberAttempted: cleanMatric };
  }

  return { result: 'valid', student, matricNumberAttempted: cleanMatric };
}

const validateMatricNumber = validateByMatricNumber;

module.exports = {
  issueTokenForStudent,
  validateScannedToken,
  validateByMatricNumber,
  validateMatricNumber,
  revokeTokenByHash,
  revokeAllTokensForStudent,
};
