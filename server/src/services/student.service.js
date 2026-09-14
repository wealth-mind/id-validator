'use strict';

/**
 * src/services/student.service.js
 *
 * Business logic for student CRUD operations.
 * This is the only layer that talks to the Student model directly
 * (outside of token.service.js which operates on a pre-fetched document).
 */

const Student = require('../models/student.model');
const { issueTokenForStudent } = require('./token.service');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Create a new student record and immediately issue a signed QR token.
 *
 * @param {object} data - { matricNumber, fullName, department, programLevel, validUntil, photoUrl?, enrollmentStatus? }
 * @returns {Promise<{ student: object, tokenStr: string, qrImage: string }>}
 */
async function createStudent(data) {
  const { matricNumber, fullName, college, department, programLevel, validUntil, photoUrl, status, enrollmentStatus } = data;

  // Check for duplicate matric number before attempting save (better error message)
  const existing = await Student.findOne({ matricNumber: matricNumber.toUpperCase() });
  if (existing) {
    const err = new Error(`A student with matric number '${matricNumber}' already exists.`);
    err.statusCode = 409;
    throw err;
  }

  const student = new Student({
    matricNumber,
    fullName,
    college: college || '',
    department,
    programLevel,
    validUntil: new Date(validUntil),
    photoUrl: photoUrl || null,
    status: status || enrollmentStatus || 'active',
  });

  // issueTokenForStudent calls student.save() internally
  const { tokenStr, qrImage, expiresAt } = await issueTokenForStudent(student);

  return {
    student: sanitizeStudent(student),
    tokenStr,
    qrImage,
    tokenExpiresAt: expiresAt,
  };
}

/**
 * Update mutable fields of an existing student.
 * matricNumber is immutable — changes to it would break existing tokens.
 *
 * @param {string} studentId - MongoDB ObjectId string
 * @param {object} updates   - allowlisted fields only
 * @returns {Promise<object>} sanitized student
 */
async function updateStudent(studentId, updates) {
  // Allowlist: do NOT allow matricNumber or currentToken to be patched directly
  const ALLOWED_FIELDS = ['fullName', 'college', 'department', 'programLevel', 'photoUrl', 'status', 'enrollmentStatus', 'validUntil'];

  const safeUpdates = {};
  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      if (field === 'enrollmentStatus') {
        safeUpdates.status = updates[field];
      } else {
        safeUpdates[field] = updates[field];
      }
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    const err = new Error('No valid fields provided for update.');
    err.statusCode = 400;
    throw err;
  }

  const student = await Student.findByIdAndUpdate(
    studentId,
    { $set: safeUpdates },
    { new: true, runValidators: true }
  );

  if (!student) {
    const err = new Error('Student not found.');
    err.statusCode = 404;
    throw err;
  }

  return sanitizeStudent(student);
}

/**
 * List students with optional text search and pagination.
 *
 * @param {object} options
 * @param {string}  [options.search]           - text search (fullName or matricNumber)
 * @param {string}  [options.status]           - filter by status
 * @param {string}  [options.enrollmentStatus] - fallback filter
 * @param {string}  [options.department]       - filter by department
 * @param {number}  [options.page=1]
 * @param {number}  [options.limit=20]
 * @returns {Promise<{ data: object[], total: number, page: number, totalPages: number }>}
 */
async function listStudents({ search, status, enrollmentStatus, department, page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  const conditions = [];

  if (search) {
    conditions.push({
      $or: [
        { matricNumber: { $regex: search.toUpperCase(), $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const targetStatus = status || enrollmentStatus;
  if (targetStatus) {
    conditions.push({
      $or: [
        { status: targetStatus },
        { enrollmentStatus: targetStatus },
      ],
    });
  }

  if (department) {
    conditions.push({ department: { $regex: department, $options: 'i' } });
  }

  const filter = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : { $and: conditions }) : {};

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .select('-tokens.tokenHash') // never expose token hash to clients
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  const sanitizedStudents = students.map((s) => sanitizeStudent(s));

  return {
    data: sanitizedStudents,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * Fetch a single student by MongoDB ID.
 * @param {string} studentId
 * @returns {Promise<object>} sanitized student
 */
async function getStudentById(studentId) {
  const student = await Student.findById(studentId).select('-tokens.tokenHash');
  if (!student) {
    const err = new Error('Student not found.');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeStudent(student);
}

/**
 * Strip sensitive token internals before returning to clients.
 * The tokenHash is only for internal server-side comparison.
 */
function sanitizeStudent(student) {
  const obj = student.toObject ? student.toObject() : { ...student };
  if (obj.tokens && Array.isArray(obj.tokens)) {
    obj.tokens = obj.tokens.map((t) => {
      const tokenObj = t.toObject ? t.toObject() : { ...t };
      delete tokenObj.tokenHash;
      return tokenObj;
    });
  }
  if (obj.currentToken) {
    delete obj.currentToken.tokenHash;
  }
  if (!obj.status && obj.enrollmentStatus) {
    obj.status = obj.enrollmentStatus;
  }
  return obj;
}

module.exports = { createStudent, updateStudent, listStudents, getStudentById, sanitizeStudent };
