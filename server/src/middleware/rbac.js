'use strict';

/**
 * src/middleware/rbac.js
 *
 * Role-based access control guard.
 *
 * Usage:
 *   router.get('/admin-only', auth, requireRole('registrar_admin'), handler)
 *   router.post('/scan', auth, requireRole('security', 'library', 'exam_invigilator', 'registrar_admin'), handler)
 *
 * Must be used AFTER the auth middleware so req.staff is populated.
 */

/**
 * Returns an Express middleware that allows only the specified roles.
 * @param {...string} roles - one or more allowed role strings
 */
function requireRole(...roles) {
  return function rbacGuard(req, res, next) {
    if (!req.staff) {
      // This means auth middleware was not applied before rbac — server config issue
      return res.status(500).json({ success: false, message: 'Server configuration error: auth middleware missing.' });
    }

    if (!roles.includes(req.staff.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
}

module.exports = { requireRole };
