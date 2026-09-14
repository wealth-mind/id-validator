'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[migrate] Connected to MongoDB');

    const collection = mongoose.connection.collection('students');
    const students = await collection.find({}).toArray();

    let count = 0;
    for (const s of students) {
      if (s.currentToken && (!s.tokens || s.tokens.length === 0)) {
        console.log(`[migrate] Migrating student: ${s.matricNumber}`);
        await collection.updateOne(
          { _id: s._id },
          {
            $set: {
              tokens: [
                {
                  tokenHash: s.currentToken.tokenHash,
                  issuedAt: s.currentToken.issuedAt || new Date(),
                  expiresAt: s.currentToken.expiresAt,
                  revoked: Boolean(s.currentToken.revoked),
                },
              ],
            },
          }
        );
        count++;
      }
    }

    console.log(`[migrate] Successfully migrated ${count} student records.`);
  } catch (err) {
    console.error('[migrate] Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
