'use strict';

/**
 * src/utils/qrImage.js
 *
 * Generates a QR code image from a token string.
 * Returns a base64 PNG data URL suitable for embedding in an <img> tag
 * or for download/printing from the admin dashboard.
 */

const QRCode = require('qrcode');

/**
 * Render `tokenStr` as a QR code image.
 *
 * @param {string} tokenStr - the signed, base64url-encoded token
 * @returns {Promise<string>} base64 PNG data URL, e.g. "data:image/png;base64,..."
 */
async function generateQrImage(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') {
    throw new Error('generateQrImage: tokenStr must be a non-empty string');
  }

  const dataUrl = await QRCode.toDataURL(tokenStr, {
    errorCorrectionLevel: 'M', // medium — balances size vs. error resilience
    type: 'image/png',
    margin: 2,
    width: 300,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return dataUrl; // "data:image/png;base64,<base64>"
}

module.exports = { generateQrImage };
