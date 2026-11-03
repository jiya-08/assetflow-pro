const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { status, priority, assetId, page = 1, limit = 10 } = req.query;

    const query = {};

    // Employees can see records they reported
    if (req.user.role === 'EMPLOYEE') {
      query.reportedBy = req.user._id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (assetId) {
      query.asset = assetId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Maintenance.countDocuments(query);
    const records = await Maintenance.find(query)
      .populate('asset', 'name assetId category brand model location status')
      .populate('reportedBy', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new maintenance request
// @route   POST /api/maintenance
// @access  Private
const createMaintenanceRequest = async (req, res, next) => {
  try {
    const { assetId, issueDescription, priority, scheduledDate } = req.body;

    if (!assetId || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Asset ID and Issue Description.'
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const maintenance = await Maintenance.create({
      asset: assetId,
      reportedBy: req.user._id,
      issueDescription: issueDescription.trim(),
      priority: priority || 'Medium',
      status: 'Pending',
      scheduledDate: scheduledDate || null
    });

    await logAudit({
      user: req.user,
      action: 'MAINTENANCE_REQUESTED',
      module: 'MAINTENANCE',
      targetId: maintenance._id,
      targetName: `${asset.name} (${asset.assetId}) - ${priority || 'Medium'} Priority`,
      details: { issueDescription, priority },
      ipAddress: req.ip
    });

    const populated = await Maintenance.findById(maintenance._id)
      .populate('asset')
      .populate('reportedBy', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted successfully.',
      record: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update maintenance status, technician, cost, notes
// @route   PUT /api/maintenance/:id
// @access  Private (Admin, Manager)
const updateMaintenanceRecord = async (req, res, next) => {
  try {
    const {
      status,
      assignedTechnician,
      maintenanceCost,
      scheduledDate,
      completedDate,
      resolutionNotes,
      priority
    } = req.body;

    const maintenance = await Maintenance.findById(req.params.id).populate('asset');
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    if (priority) maintenance.priority = priority;
    if (assignedTechnician !== undefined) maintenance.assignedTechnician = assignedTechnician.trim();
    if (maintenanceCost !== undefined) maintenance.maintenanceCost = Number(maintenanceCost);
    if (scheduledDate) maintenance.scheduledDate = scheduledDate;
    if (completedDate) maintenance.completedDate = completedDate;
    if (resolutionNotes !== undefined) maintenance.resolutionNotes = resolutionNotes.trim();

    // Handle status workflow & asset state transitions
    if (status && status !== maintenance.status) {
      maintenance.status = status;

      const asset = await Asset.findById(maintenance.asset._id);
      if (asset) {
        if (status === 'In Progress') {
          asset.status = 'Under Maintenance';
          await asset.save();
        } else if (status === 'Completed') {
          // If asset was under maintenance, restore it to Available (or if assigned employee exists, to Assigned)
          asset.status = asset.assignedEmployee ? 'Assigned' : 'Available';
          await asset.save();
          if (!maintenance.completedDate) {
            maintenance.completedDate = new Date();
          }
        } else if (status === 'Rejected') {
          if (asset.status === 'Under Maintenance') {
            asset.status = asset.assignedEmployee ? 'Assigned' : 'Available';
            await asset.save();
          }
        }
      }
    }

    await maintenance.save();

    await logAudit({
      user: req.user,
      action: 'MAINTENANCE_UPDATED',
      module: 'MAINTENANCE',
      targetId: maintenance._id,
      targetName: `${maintenance.asset?.name || 'Asset'} maintenance [${maintenance.status}]`,
      details: { status: maintenance.status, cost: maintenance.maintenanceCost, assignedTechnician },
      ipAddress: req.ip
    });

    const populated = await Maintenance.findById(maintenance._id)
      .populate('asset')
      .populate('reportedBy', 'name email department');

    res.status(200).json({
      success: true,
      message: 'Maintenance record updated successfully.',
      record: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceRecords,
  createMaintenanceRequest,
  updateMaintenanceRecord
};
