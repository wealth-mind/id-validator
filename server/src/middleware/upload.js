'use strict';

/**
 * src/middleware/upload.js
 *
 * Multer middleware for photo uploads.
 * - Stores files to disk in uploads/ at the project root.
 * - Enforces MIME type allowlist and 5 MB size limit.
 * - Generates a unique filename to avoid collisions.
 */

const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');
const fs     = require('fs');

// Ensure the uploads directory exists at server root
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only JPEG, PNG, and WEBP images are allowed.'), { statusCode: 400 }),
      false,
    );
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = upload;
