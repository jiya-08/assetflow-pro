const Asset = require('../models/Asset');
const Assignment = require('../models/Assignment');
const Maintenance = require('../models/Maintenance');
const { logAudit } = require('../services/auditService');
const QRCode = require('qrcode');

// @desc    Get all assets with filtering, searching, sorting & pagination
// @route   GET /api/assets
// @access  Private
const getAssets = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      department,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }

    // Search by name, assetId, serialNumber, brand, model
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { assetId: searchRegex },
        { serialNumber: searchRegex },
        { brand: searchRegex },
        { model: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const totalAssets = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .populate('assignedEmployee', 'name employeeId email department designation')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: assets.length,
      total: totalAssets,
      pages: Math.ceil(totalAssets / limitNum) || 1,
      currentPage: pageNum,
      assets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Private
const getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).populate(
      'assignedEmployee',
      'name employeeId email phone department designation status'
    );

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Also fetch assignment history & maintenance history for this asset
    const assignmentHistory = await Assignment.find({ asset: asset._id })
      .populate('employee', 'name employeeId department')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    const maintenanceHistory = await Maintenance.find({ asset: asset._id })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      asset,
      assignmentHistory,
      maintenanceHistory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private (Admin, Manager)
const createAsset = async (req, res, next) => {
  try {
    const {
      name,
      assetId,
      category,
      description,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      location,
      department,
      warrantyExpiryDate
    } = req.body;

    if (!name || !assetId || !category || !brand || !model || !serialNumber || !location || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Asset ID, Category, Brand, Model, Serial Number, Location, Department).'
      });
    }

    // Check duplicate Asset ID
    const existingAssetId = await Asset.findOne({ assetId: assetId.trim().toUpperCase() });
    if (existingAssetId) {
      return res.status(400).json({
        success: false,
        message: `Asset ID '${assetId}' already exists. Please use a unique Asset ID.`
      });
    }

    // Check duplicate Serial Number
    const existingSerial = await Asset.findOne({ serialNumber: serialNumber.trim() });
    if (existingSerial) {
      return res.status(400).json({
        success: false,
        message: `Serial Number '${serialNumber}' already registered with another asset.`
      });
    }

    // Generate QR Code data payload
    const qrPayload = JSON.stringify({
      assetId: assetId.trim().toUpperCase(),
      name,
      category,
      serialNumber: serialNumber.trim()
    });
    let qrCodeData = '';
    try {
      qrCodeData = await QRCode.toDataURL(qrPayload);
    } catch (qrErr) {
      console.warn('QR code generation failed:', qrErr.message);
    }

    const asset = await Asset.create({
      name: name.trim(),
      assetId: assetId.trim().toUpperCase(),
      category,
      description: description || '',
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      purchaseDate: purchaseDate || Date.now(),
      purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
      location: location.trim(),
      department: department.trim(),
      status: 'Available',
      assignedEmployee: null,
      warrantyExpiryDate: warrantyExpiryDate || null,
      qrCodeData
    });

    // Audit log
    await logAudit({
      user: req.user,
      action: 'ASSET_CREATED',
      module: 'ASSETS',
      targetId: asset._id,
      targetName: `${asset.name} (${asset.assetId})`,
      details: { category: asset.category, brand: asset.brand, location: asset.location },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing asset
// @route   PUT /api/assets/:id
// @access  Private (Admin, Manager)
const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const {
      name,
      assetId,
      category,
      description,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      location,
      department,
      status,
      warrantyExpiryDate
    } = req.body;

    // Check unique assetId if changed
    if (assetId && assetId.trim().toUpperCase() !== asset.assetId) {
      const duplicate = await Asset.findOne({ assetId: assetId.trim().toUpperCase() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Asset ID '${assetId}' is already in use by another asset.`
        });
      }
      asset.assetId = assetId.trim().toUpperCase();
    }

    // Check unique serialNumber if changed
    if (serialNumber && serialNumber.trim() !== asset.serialNumber) {
      const duplicate = await Asset.findOne({ serialNumber: serialNumber.trim() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Serial Number '${serialNumber}' is already in use by another asset.`
        });
      }
      asset.serialNumber = serialNumber.trim();
    }

    if (name) asset.name = name.trim();
    if (category) asset.category = category;
    if (description !== undefined) asset.description = description;
    if (brand) asset.brand = brand.trim();
    if (model) asset.model = model.trim();
    if (purchaseDate) asset.purchaseDate = purchaseDate;
    if (purchasePrice !== undefined) asset.purchasePrice = Number(purchasePrice);
    if (location) asset.location = location.trim();
    if (department) asset.department = department.trim();
    if (status) asset.status = status;
    if (warrantyExpiryDate !== undefined) asset.warrantyExpiryDate = warrantyExpiryDate;

    // Regenerate QR code if identity changed
    try {
      const qrPayload = JSON.stringify({
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        serialNumber: asset.serialNumber
      });
      asset.qrCodeData = await QRCode.toDataURL(qrPayload);
    } catch (e) {
      // Keep existing
    }

    await asset.save();

    await logAudit({
      user: req.user,
      action: 'ASSET_UPDATED',
      module: 'ASSETS',
      targetId: asset._id,
      targetName: `${asset.name} (${asset.assetId})`,
      details: { status: asset.status, department: asset.department, location: asset.location },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      asset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin only)
const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Business rule: cannot delete if currently assigned
    if (asset.status === 'Assigned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an assigned asset. Please unassign or return the asset first.'
      });
    }

    const assetIdentifier = `${asset.name} (${asset.assetId})`;
    await Asset.findByIdAndDelete(req.params.id);

    // Also clean up any active assignments or related history if desired
    await logAudit({
      user: req.user,
      action: 'ASSET_DELETED',
      module: 'ASSETS',
      targetId: req.params.id,
      targetName: assetIdentifier,
      details: {},
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Asset '${assetIdentifier}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get QR Code for an asset
// @route   GET /api/assets/:id/qrcode
// @access  Private
const getAssetQRCode = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (!asset.qrCodeData) {
      const qrPayload = JSON.stringify({
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        serialNumber: asset.serialNumber,
        status: asset.status
      });
      asset.qrCodeData = await QRCode.toDataURL(qrPayload);
      await asset.save();
    }

    res.status(200).json({
      success: true,
      qrCode: asset.qrCodeData,
      asset: {
        id: asset._id,
        name: asset.name,
        assetId: asset.assetId,
        serialNumber: asset.serialNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetQRCode
};
