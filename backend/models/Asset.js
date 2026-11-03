const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true
    },
    assetId: {
      type: String,
      required: [true, 'Asset ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Laptop',
        'Desktop',
        'Monitor',
        'Mobile',
        'Printer',
        'Networking Equipment',
        'Furniture',
        'Other'
      ]
    },
    description: {
      type: String,
      default: ''
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Available', 'Assigned', 'Under Maintenance', 'Retired'],
      default: 'Available'
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    warrantyExpiryDate: {
      type: Date
    },
    qrCodeData: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for fast filtering and searching
assetSchema.index({ name: 'text', assetId: 'text', serialNumber: 'text', brand: 'text', model: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
