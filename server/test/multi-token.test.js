'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const mongoose = require('mongoose');

const Student = require('../src/models/student.model');
const tokenService = require('../src/services/token.service');
const { hashToken } = require('../src/utils/crypto');

async function runTests() {
  console.log('🧪 Starting Multi-Token Validation Tests...');

  let usingRealDb = false;
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      usingRealDb = true;
      console.log('📦 Connected to MongoDB for testing.');
    }
  } catch (err) {
    console.log('⚠️ Could not connect to real MongoDB, running in simulated in-memory mode:', err.message);
  }

  const testMatric = 'TEST/2026/MULTI01';
  let studentDoc;

  if (usingRealDb) {
    await Student.deleteOne({ matricNumber: testMatric });
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    studentDoc = new Student({
      matricNumber: testMatric,
      fullName: 'Jane MultiToken Doe',
      department: 'Computer Science',
      programLevel: 'undergraduate',
      status: 'active',
      validUntil: futureDate,
      tokens: [],
    });
    await studentDoc.save();
  } else {
    // Simulated in-memory Student model
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    studentDoc = {
      _id: 'simulated-id-123',
      matricNumber: testMatric,
      fullName: 'Jane MultiToken Doe',
      department: 'Computer Science',
      programLevel: 'undergraduate',
      status: 'active',
      validUntil: futureDate,
      tokens: [],
      save: async function () {
        return this;
      },
    };

    // Mock Student.findOne
    Student.findOne = async function (query) {
      if (query.matricNumber === testMatric) {
        return studentDoc;
      }
      return null;
    };
  }

  // 1. Issue Token A
  console.log('Step 1: Issuing Token A...');
  const tokenA = await tokenService.issueTokenForStudent(studentDoc);
  assert(tokenA.tokenStr, 'Token A tokenStr must exist');
  assert.strictEqual(studentDoc.tokens.length, 1, 'Student should have 1 token in tokens array');

  // 2. Issue Token B (Additive Reissue - without revoking Token A)
  console.log('Step 2: Issuing Token B without revoking Token A...');
  const tokenB = await tokenService.issueTokenForStudent(studentDoc);
  assert(tokenB.tokenStr, 'Token B tokenStr must exist');
  assert.strictEqual(studentDoc.tokens.length, 2, 'Student should have 2 tokens in tokens array');
  assert.notStrictEqual(tokenA.tokenStr, tokenB.tokenStr, 'Token A and Token B strings should be distinct');

  // 3. Validate Token A
  console.log('Step 3: Validating Token A via validateScannedToken...');
  const resA = await tokenService.validateScannedToken(tokenA.tokenStr);
  assert.strictEqual(resA.result, 'valid', `Expected Token A to be valid, got: ${resA.result}`);
  assert.strictEqual(resA.student.matricNumber, testMatric);
  console.log('  ✅ Token A independently validates successfully!');

  // 4. Validate Token B
  console.log('Step 4: Validating Token B via validateScannedToken...');
  const resB = await tokenService.validateScannedToken(tokenB.tokenStr);
  assert.strictEqual(resB.result, 'valid', `Expected Token B to be valid, got: ${resB.result}`);
  assert.strictEqual(resB.student.matricNumber, testMatric);
  console.log('  ✅ Token B independently validates successfully!');

  // 5. Validate by Matric Number (manual lookup)
  console.log('Step 5: Validating student by matric number...');
  const resMatric = await tokenService.validateByMatricNumber(testMatric);
  assert.strictEqual(resMatric.result, 'valid', `Expected validateByMatricNumber to be valid, got: ${resMatric.result}`);
  console.log('  ✅ validateByMatricNumber works when active tokens exist!');

  // 6. Test specific revocation: Revoke Token A only
  console.log('Step 6: Testing revokeTokenByHash for Token A...');
  const hashA = hashToken(tokenA.tokenStr);
  await tokenService.revokeTokenByHash(studentDoc, hashA);

  const resAAfterRevoke = await tokenService.validateScannedToken(tokenA.tokenStr);
  assert.strictEqual(resAAfterRevoke.result, 'revoked', `Expected Token A to be revoked, got: ${resAAfterRevoke.result}`);

  const resBStillValid = await tokenService.validateScannedToken(tokenB.tokenStr);
  assert.strictEqual(resBStillValid.result, 'valid', `Expected Token B to still be valid, got: ${resBStillValid.result}`);

  const resMatricStillValid = await tokenService.validateByMatricNumber(testMatric);
  assert.strictEqual(resMatricStillValid.result, 'valid', `Expected validateByMatricNumber to still be valid, got: ${resMatricStillValid.result}`);
  console.log('  ✅ Token A is revoked while Token B remains valid!');

  // 7. Blanket revocation: Revoke all tokens
  console.log('Step 7: Testing revokeAllTokensForStudent...');
  await tokenService.revokeAllTokensForStudent(studentDoc);

  const resAFinal = await tokenService.validateScannedToken(tokenA.tokenStr);
  assert.strictEqual(resAFinal.result, 'revoked', `Expected Token A to be revoked, got: ${resAFinal.result}`);

  const resBFinal = await tokenService.validateScannedToken(tokenB.tokenStr);
  assert.strictEqual(resBFinal.result, 'revoked', `Expected Token B to be revoked, got: ${resBFinal.result}`);

  const resMatricRevoked = await tokenService.validateByMatricNumber(testMatric);
  assert.strictEqual(resMatricRevoked.result, 'revoked', `Expected validateByMatricNumber to be revoked when all tokens revoked, got: ${resMatricRevoked.result}`);
  console.log('  ✅ All tokens and manual validation are now revoked!');

  // Clean up if using real DB
  if (usingRealDb) {
    await Student.deleteOne({ matricNumber: testMatric });
    await mongoose.connection.close();
    console.log('🧹 Cleaned up test student and closed DB connection.');
  }

  console.log('\n🎉 ALL MULTI-TOKEN TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
