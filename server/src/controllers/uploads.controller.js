'use strict';

/**
 * src/controllers/uploads.controller.js
 *
 * Handles photo upload. The file has already been validated and saved
 * to disk by the multer middleware before this controller runs.
 */

const path = require('path');

async function uploadPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  // Build the public URL for the uploaded file.
  // In production, replace this base URL with your CDN / static host.
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

  return res.status(200).json({ success: true, photoUrl });
}

module.exports = { uploadPhoto };
