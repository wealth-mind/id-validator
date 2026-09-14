'use strict';

/**
 * scripts/seed.js
 *
 * Creates an initial registrar_admin account so the system is usable
 * immediately after setup. Safe to run multiple times — will skip creation
 * if the admin account already exists.
 *
 * Usage:
 *   npm run seed
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Seed config (from .env) ──────────────────────────────────────────────────
const SEED_NAME = (process.env.SEED_ADMIN_NAME || 'Super Admin').trim();
const SEED_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@university.edu').trim().toLowerCase();
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[seed] Error: MONGODB_URI is not set in .env');
  process.exit(1);
}

if (!process.env.JWT_ACCESS_SECRET || !process.env.QR_TOKEN_SECRET) {
  console.warn('[seed] Warning: JWT_ACCESS_SECRET or QR_TOKEN_SECRET not set — server will fail at runtime.');
}

// ─── Run seed ─────────────────────────────────────────────────────────────────

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[seed] Connected to MongoDB');

    // Require model AFTER connection is established
    const StaffUser = require('../src/models/staffUser.model');
    // Email regex validation check
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(SEED_EMAIL)) {
      throw new Error(`Invalid SEED_ADMIN_EMAIL format: '${SEED_EMAIL}'. Must be a valid email address.`);
    }

    const existing = await StaffUser.findOne({ email: SEED_EMAIL });

    if (existing) {
      console.log(`[seed] Admin account already exists for '${SEED_EMAIL}'. Skipping.`);
    } else {
      const BCRYPT_ROUNDS = 12;
      const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

      await StaffUser.create({
        name: SEED_NAME,
        email: SEED_EMAIL,
        passwordHash,
        role: 'registrar_admin',
      });

      console.log('[seed] ✅ Admin account created successfully!');
      console.log(`       Name:  ${SEED_NAME}`);
      console.log(`       Email: ${SEED_EMAIL}`);
      console.log(`       Role:  registrar_admin`);
      console.log('');
      console.log('[seed] ⚠️  Change the default password immediately after first login!');
    }
  } catch (err) {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('[seed] Connection closed.');
    process.exit(0);
  }
})();
