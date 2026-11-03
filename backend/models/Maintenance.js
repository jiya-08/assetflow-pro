const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting user reference is required']
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
      default: 'Pending'
    },
    assignedTechnician: {
      type: String,
      default: ''
    },
    maintenanceCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    },
    scheduledDate: {
      type: Date
    },
    completedDate: {
      type: Date
    },
    resolutionNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
