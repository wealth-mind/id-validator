'use strict';

/**
 * server.js — Entry point
 * Loads environment, connects to MongoDB, then starts the HTTP server.
 */

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`[server] Running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`[server] Listening on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[server] Fatal startup error:', err.message);
    process.exit(1);
  }
})();
