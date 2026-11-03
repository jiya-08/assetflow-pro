const Asset = require('../models/Asset');
const Employee = require('../models/Employee');
const Assignment = require('../models/Assignment');
const Booking = require('../models/Booking');
const Maintenance = require('../models/Maintenance');
const AuditLog = require('../models/AuditLog');

// @desc    Get complete real-time dashboard statistics, chart datasets, and recent activities
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Key Metric Counters
    const [
      totalAssets,
      availableAssets,
      assignedAssets,
      maintenanceAssets,
      retiredAssets,
      totalEmployees,
      pendingBookings,
      pendingMaintenance
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ status: 'Available' }),
      Asset.countDocuments({ status: 'Assigned' }),
      Asset.countDocuments({ status: 'Under Maintenance' }),
      Asset.countDocuments({ status: 'Retired' }),
      Employee.countDocuments({ status: 'Active' }),
      Booking.countDocuments({ status: 'Pending' }),
      Maintenance.countDocuments({ status: 'Pending' })
    ]);

    const totalPendingRequests = pendingBookings + pendingMaintenance;

    // 2. Asset Distribution by Category (Real aggregation from MongoDB)
    const categoryAggregation = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchasePrice' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categoryDistribution = categoryAggregation.map((item) => ({
      name: item._id,
      count: item.count,
      totalValue: item.totalValue
    }));

    // 3. Asset Status Breakdown
    const statusOverview = [
      { name: 'Available', count: availableAssets, color: '#10b981' },
      { name: 'Assigned', count: assignedAssets, color: '#3b82f6' },
      { name: 'Under Maintenance', count: maintenanceAssets, color: '#f59e0b' },
      { name: 'Retired', count: retiredAssets, color: '#ef4444' }
    ];

    // 4. Monthly Asset Assignments (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAssignments = await Assignment.aggregate([
      {
        $match: {
          assignmentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$assignmentDate' },
            month: { $month: '$assignmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Generate full 6-month continuous timeline
    const timeline = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${monthNames[d.getMonth()]} ${y}`;
      const found = monthlyAssignments.find((m) => m._id.year === y && m._id.month === mIdx);
      timeline.push({
        month: label,
        assignments: found ? found.count : 0
      });
    }

    // 5. Maintenance Requests by Priority
    const maintenancePriorityAggregation = await Maintenance.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const maintenanceTrends = ['Low', 'Medium', 'High', 'Critical'].map((p) => {
      const found = maintenancePriorityAggregation.find((m) => m._id === p);
      return {
        priority: p,
        count: found ? found.count : 0
      };
    });

    // 6. Recent Real-Time Feeds
    const [recentActivities, recentAssignments, pendingMaintenanceList, upcomingBookings] = await Promise.all([
      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(6),
      Assignment.find()
        .populate('asset', 'name assetId category')
        .populate('employee', 'name employeeId department')
        .sort({ assignmentDate: -1 })
        .limit(5),
      Maintenance.find({ status: { $in: ['Pending', 'In Progress'] } })
        .populate('asset', 'name assetId category location')
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.find({ status: { $in: ['Pending', 'Approved'] }, endDate: { $gte: new Date() } })
        .populate('asset', 'name assetId category')
        .populate('requestedBy', 'name email')
        .sort({ startDate: 1 })
        .limit(5)
    ]);

    // 7. Total Asset Value Valuation
    const totalAssetValuation = await Asset.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$purchasePrice' }
        }
      }
    ]);
    const totalInventoryValue = totalAssetValuation.length > 0 ? totalAssetValuation[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalAssets,
        availableAssets,
        assignedAssets,
        underMaintenance: maintenanceAssets,
        retiredAssets,
        totalEmployees,
        pendingRequests: totalPendingRequests,
        pendingBookings,
        pendingMaintenance,
        totalInventoryValue
      },
      charts: {
        categoryDistribution,
        statusOverview,
        monthlyAssignments: timeline,
        maintenanceTrends
      },
      feeds: {
        recentActivities,
        recentAssignments,
        pendingMaintenanceList,
        upcomingBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
