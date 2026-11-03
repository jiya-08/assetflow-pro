const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log entry in MongoDB
 * @param {Object} options
 * @param {Object} options.user - User object (req.user)
 * @param {string} options.action - Action identifier e.g. 'ASSET_CREATED'
 * @param {string} options.module - 'AUTH' | 'ASSETS' | 'EMPLOYEES' | 'ASSIGNMENTS' | 'BOOKINGS' | 'MAINTENANCE' | 'SETTINGS' | 'SYSTEM'
 * @param {string} [options.targetId] - Target document ID
 * @param {string} [options.targetName] - Target display name
 * @param {Object} [options.details] - Detailed context or diff
 * @param {string} [options.ipAddress] - Request IP address
 */
const logAudit = async ({ user, action, module, targetId = '', targetName = '', details = {}, ipAddress = '' }) => {
  try {
    const entry = new AuditLog({
      user: user?._id || user?.id || null,
      userName: user?.name || 'System',
      userEmail: user?.email || '',
      userRole: user?.role || 'SYSTEM',
      action,
      module,
      targetId: String(targetId || ''),
      targetName: String(targetName || ''),
      details,
      ipAddress: ipAddress || '',
      timestamp: new Date()
    });

    await entry.save();
    return entry;
  } catch (err) {
    console.error(`[AUDIT_SERVICE] Failed to create audit log: ${err.message}`);
    // Non-blocking: audit failure should not break the core business transaction
    return null;
  }
};

module.exports = { logAudit };
