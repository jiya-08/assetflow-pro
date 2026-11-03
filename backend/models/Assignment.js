const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user reference is required']
    },
    assignmentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    expectedReturnDate: {
      type: Date
    },
    actualReturnDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['Active', 'Returned'],
      default: 'Active'
    },
    notes: {
      type: String,
      default: ''
    },
    returnNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
