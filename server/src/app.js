'use strict';

/**
 * src/app.js
 *
 * Configures and exports the Express application.
 * Does NOT start the HTTP server — that is server.js's responsibility.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth.routes');
const studentsRoutes = require('./routes/students.routes');
const scanRoutes    = require('./routes/scan.routes');
const logsRoutes    = require('./routes/logs.routes');
const uploadsRoutes = require('./routes/uploads.routes');

const path = require('path');

// ─── CORS configuration ───────────────────────────────────────────────────────

/**
 * Build the CORS options object from the CLIENT_ORIGINS env var.
 *
 * CLIENT_ORIGINS is a comma-separated list of allowed origins, e.g.:
 *   http://localhost:5173,http://localhost:5174
 *
 * Requests with no Origin header (curl, health checks, mobile clients) are
 * allowed through. Any other origin not in the list receives a CORS error.
 */
function buildCorsOptions() {
  const rawOrigins = process.env.CLIENT_ORIGINS || '';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    console.warn(
      '[cors] CLIENT_ORIGINS is not set. CORS will allow all origins — DO NOT use this in production.'
    );
  }

  return {
    origin(requestOrigin, callback) {
      // Allow requests with no Origin header (curl, Postman without origin, health probes)
      if (!requestOrigin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy: origin '${requestOrigin}' is not allowed.`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  };
}

// ─── App factory ─────────────────────────────────────────────────────────────

const app = express();

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — must come before route handlers
app.use(cors(buildCorsOptions()));

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies (for any form submissions)
app.use(express.urlencoded({ extended: false }));

// ─── Health check (public) ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Static: serve uploaded photos ──────────────────────────────────────────
// Files land in <project-root>/uploads/ via multer and are served publicly.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/scan',    scanRoutes);
app.use('/api/logs',    logsRoutes);
app.use('/api/uploads', uploadsRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors from our own cors() middleware
  if (err.message && err.message.startsWith('CORS policy:')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(' | ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `Duplicate value for '${field}'.` });
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid value for field '${err.path}'.` });
  }

  // Log unexpected server errors (but never leak stack to client in production)
  console.error('[error]', err);

  return res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

module.exports = app;
