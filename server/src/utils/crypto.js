'use strict';

/**
 * src/utils/crypto.js
 *
 * QR token cryptography helpers.
 *
 * Token format (base64url-encoded JSON):
 *   { matricNumber, expiresAt (ISO string), sig (HMAC-SHA256 hex) }
 *
 * The student document stores SHA-256(token_string) so that:
 *  - The plaintext token is never persisted.
 *  - A reissued/revoked token cannot be replayed (hash won't match).
 */

const crypto = require('crypto');

/**
 * Return the HMAC-SHA256 secret from the environment.
 * Throws at runtime if missing (rather than silently using an empty key).
 */
function getQrSecret() {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) {
    throw new Error('QR_TOKEN_SECRET environment variable is not set.');
  }
  return secret;
}

/**
 * Compute HMAC-SHA256 over `data` using the QR_TOKEN_SECRET.
 * @param {string} data
 * @returns {string} hex digest
 */
function hmac(data) {
  return crypto.createHmac('sha256', getQrSecret()).update(data).digest('hex');
}

/**
 * Build and sign a compact QR token for the given student.
 *
 * @param {string} matricNumber
 * @param {Date}   expiresAt
 * @returns {string} base64url-encoded signed token string
 */
function signQrPayload(matricNumber, expiresAt) {
  if (!matricNumber || !expiresAt) {
    throw new Error('matricNumber and expiresAt are required to sign a QR payload.');
  }

  const payload = {
    m: matricNumber,                    // compact key name to keep the QR code small
    e: new Date(expiresAt).toISOString(),
  };

  const payloadStr = JSON.stringify(payload);
  const sig = hmac(payloadStr);
  const token = JSON.stringify({ ...payload, s: sig });

  // base64url encode (no padding)
  return Buffer.from(token).toString('base64url');
}

/**
 * Decode and verify a scanned QR token string.
 *
 * Uses crypto.timingSafeEqual to compare signatures, preventing timing attacks.
 *
 * @param {string} tokenStr - the raw base64url string from the QR code scan
 * @returns {{ valid: boolean, matricNumber?: string, expiresAt?: Date, reason?: string }}
 */
function verifyQrPayload(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') {
    return { valid: false, reason: 'invalid_format' };
  }

  let parsed;
  try {
    const json = Buffer.from(tokenStr, 'base64url').toString('utf8');
    parsed = JSON.parse(json);
  } catch {
    return { valid: false, reason: 'invalid_format' };
  }

  const { m: matricNumber, e: expiresAtStr, s: receivedSig } = parsed;

  if (!matricNumber || !expiresAtStr || !receivedSig) {
    return { valid: false, reason: 'invalid_format' };
  }

  // Re-compute expected signature from the payload (excluding the sig field)
  const payloadStr = JSON.stringify({ m: matricNumber, e: expiresAtStr });
  const expectedSig = hmac(payloadStr);

  // Timing-safe comparison
  let sigMatch = false;
  try {
    sigMatch = crypto.timingSafeEqual(
      Buffer.from(receivedSig, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch {
    // Buffer lengths differ → not equal
    return { valid: false, reason: 'invalid_signature' };
  }

  if (!sigMatch) {
    return { valid: false, reason: 'invalid_signature' };
  }

  const expiresAt = new Date(expiresAtStr);
  if (isNaN(expiresAt.getTime())) {
    return { valid: false, reason: 'invalid_format' };
  }

  return { valid: true, matricNumber, expiresAt };
}

/**
 * Compute a SHA-256 hash of a token string.
 * Used to store a fingerprint of the current token in the student document
 * without persisting the plaintext token.
 *
 * @param {string} tokenStr
 * @returns {string} hex digest
 */
function hashToken(tokenStr) {
  return crypto.createHash('sha256').update(tokenStr).digest('hex');
}

module.exports = { signQrPayload, verifyQrPayload, hashToken };
