const Assignment = require('../models/Assignment');
const Asset = require('../models/Asset');
const Employee = require('../models/Employee');
const { logAudit } = require('../services/auditService');

// @desc    Get all assignments with filters and pagination
// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let assignmentsQuery = Assignment.find(query)
      .populate('asset', 'name assetId category brand model serialNumber status')
      .populate('employee', 'name employeeId email department designation')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    let assignments = await assignmentsQuery;

    // Filter in-memory if search is provided across populated fields
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      assignments = assignments.filter((a) => {
        const assetName = a.asset?.name?.toLowerCase() || '';
        const assetId = a.asset?.assetId?.toLowerCase() || '';
        const empName = a.employee?.name?.toLowerCase() || '';
        const empId = a.employee?.employeeId?.toLowerCase() || '';
        return assetName.includes(q) || assetId.includes(q) || empName.includes(q) || empId.includes(q);
      });
    }

    const total = assignments.length;
    const paginated = assignments.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginated.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      assignments: paginated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign an asset to an employee
// @route   POST /api/assignments
// @access  Private (Admin, Manager)
const createAssignment = async (req, res, next) => {
  try {
    const { assetId, employeeId, assignmentDate, expectedReturnDate, notes } = req.body;

    if (!assetId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Both Asset and Employee must be selected.'
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Business rule: only Available assets can be assigned
    if (asset.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Asset '${asset.name}' is currently '${asset.status}' and cannot be assigned. Only Available assets can be allocated.`
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (employee.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign asset to employee with status '${employee.status}'. Employee must be Active.`
      });
    }

    // Create assignment record
    const assignment = await Assignment.create({
      asset: asset._id,
      employee: employee._id,
      assignedBy: req.user._id,
      assignmentDate: assignmentDate || Date.now(),
      expectedReturnDate: expectedReturnDate || null,
      status: 'Active',
      notes: notes || ''
    });

    // Update asset status
    asset.status = 'Assigned';
    asset.assignedEmployee = employee._id;
    await asset.save();

    await logAudit({
      user: req.user,
      action: 'ASSET_ASSIGNED',
      module: 'ASSIGNMENTS',
      targetId: assignment._id,
      targetName: `${asset.name} (${asset.assetId}) -> ${employee.name}`,
      details: {
        assetId: asset.assetId,
        employeeName: employee.name,
        expectedReturnDate
      },
      ipAddress: req.ip
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('asset')
      .populate('employee')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      message: `Asset '${asset.name}' successfully assigned to ${employee.name}.`,
      assignment: populatedAssignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return an assigned asset
// @route   POST /api/assignments/:id/return
// @access  Private (Admin, Manager)
const returnAssignment = async (req, res, next) => {
  try {
    const { returnDate, returnNotes } = req.body;

    const assignment = await Assignment.findById(req.params.id)
      .populate('asset')
      .populate('employee');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    if (assignment.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'This assignment has already been marked as returned.'
      });
    }

    assignment.status = 'Returned';
    assignment.actualReturnDate = returnDate || Date.now();
    assignment.returnNotes = returnNotes || '';
    await assignment.save();

    // Update asset status back to Available and remove assignedEmployee
    if (assignment.asset) {
      const asset = await Asset.findById(assignment.asset._id);
      if (asset) {
        asset.status = 'Available';
        asset.assignedEmployee = null;
        await asset.save();
      }
    }

    await logAudit({
      user: req.user,
      action: 'ASSET_RETURNED',
      module: 'ASSIGNMENTS',
      targetId: assignment._id,
      targetName: `${assignment.asset?.name || 'Asset'} returned from ${assignment.employee?.name || 'Employee'}`,
      details: {
        returnDate: assignment.actualReturnDate,
        returnNotes
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Asset '${assignment.asset?.name}' returned successfully and marked Available.`,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  returnAssignment
};
