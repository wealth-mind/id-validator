'use strict';

/**
 * src/middleware/auth.js
 *
 * Verifies the JWT access token from the Authorization header.
 * On success, attaches the decoded payload as `req.staff`.
 * On failure, returns 401.
 */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token missing or malformed. Use: Authorization: Bearer <token>',
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    console.error('[auth] JWT_ACCESS_SECRET is not set — cannot verify tokens.');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.staff = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token has expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token.' });
  }
}

module.exports = authMiddleware;
