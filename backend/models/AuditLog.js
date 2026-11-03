const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userName: {
      type: String,
      default: 'System'
    },
    userEmail: {
      type: String,
      default: ''
    },
    userRole: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true
    },
    module: {
      type: String,
      enum: ['AUTH', 'ASSETS', 'EMPLOYEES', 'ASSIGNMENTS', 'BOOKINGS', 'MAINTENANCE', 'SETTINGS', 'SYSTEM'],
      required: true
    },
    targetId: {
      type: String,
      default: ''
    },
    targetName: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ module: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
