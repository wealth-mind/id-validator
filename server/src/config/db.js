'use strict';

/**
 * src/config/db.js
 * Establishes and exports the Mongoose connection.
 */

const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  // Modern Mongoose versions handle these internally, but being explicit is fine
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  try {
    await mongoose.connect(uri, MONGO_OPTIONS);
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[db] Connection error:', err.message);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[db] MongoDB reconnected.');
  });
}

module.exports = connectDB;
