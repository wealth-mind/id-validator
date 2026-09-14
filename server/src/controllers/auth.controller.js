'use strict';

/**
 * src/controllers/auth.controller.js
 *
 * Handles login and token refresh.
 * Business logic (password comparison, JWT signing) lives here since
 * auth is not delegated to a separate service — it is thin enough.
 * The controller does NOT talk to Mongoose directly; it uses the StaffUser
 * model only through bcryptjs and jwt — consistent with keeping DB access
 * centralised. If this grows, extract to auth.service.js.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const StaffUser = require('../models/staffUser.model');

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Explicitly select passwordHash (it's excluded by default via `select: false`)
    const staff = await StaffUser.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    if (!staff) {
      // Use a generic message to avoid user enumeration
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const tokenPayload = { id: staff._id.toString(), email: staff.email, role: staff.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Refresh token has expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    // Verify the staff member still exists and hasn't been removed
    const staff = await StaffUser.findById(decoded.id);
    if (!staff) {
      return res.status(401).json({ success: false, message: 'Account no longer exists.' });
    }

    const tokenPayload = { id: staff._id.toString(), email: staff.email, role: staff.role };
    const newAccessToken = signAccessToken(tokenPayload);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh };
