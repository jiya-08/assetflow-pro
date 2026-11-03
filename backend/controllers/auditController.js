const AuditLog = require('../models/AuditLog');

// @desc    Get system audit logs with filtering and pagination
// @route   GET /api/audit-logs
// @access  Private (Admin only)
const getAuditLogs = async (req, res, next) => {
  try {
    const { module: mod, action, search, page = 1, limit = 15 } = req.query;

    const query = {};

    if (mod && mod !== 'All') {
      query.module = mod;
    }

    if (action && action !== 'All') {
      query.action = action;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { action: searchRegex },
        { targetName: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
