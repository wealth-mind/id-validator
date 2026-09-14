'use strict';

/**
 * src/routes/uploads.routes.js
 *
 * POST /api/uploads/photo — registrar_admin only.
 * Accepts multipart/form-data with field name "photo".
 */

const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const upload     = require('../middleware/upload');
const { uploadPhoto } = require('../controllers/uploads.controller');

// Custom multer error handler: converts multer errors to JSON
function handleUploadErrors(err, req, res, next) {
  if (err) {
    // MulterError (size limit exceeded, etc.)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 5 MB.' });
    }
    // Our custom fileFilter error or any other upload error
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
  next();
}

router.post(
  '/photo',
  auth,
  requireRole('registrar_admin'),
  upload.single('photo'),
  handleUploadErrors,
  uploadPhoto,
);

module.exports = router;
