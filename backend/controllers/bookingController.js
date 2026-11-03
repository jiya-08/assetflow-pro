const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');

// @desc    Get all bookings (Employees see their own; Admin/Manager see all)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
  try {
    const { status, assetId, page = 1, limit = 10 } = req.query;

    const query = {};

    // Role-based visibility
    if (req.user.role === 'EMPLOYEE') {
      query.requestedBy = req.user._id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (assetId) {
      query.asset = assetId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('asset', 'name assetId category brand model location status')
      .populate('requestedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (All authenticated users)
const createBooking = async (req, res, next) => {
  try {
    const { assetId, startDate, endDate, purpose } = req.body;

    if (!assetId || !startDate || !endDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Asset, Start Date, End Date, and Purpose.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format provided.'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date and time must be later than start date and time.'
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Resource/Asset not found.' });
    }

    // Check if asset is retired or under maintenance
    if (asset.status === 'Retired' || asset.status === 'Under Maintenance') {
      return res.status(400).json({
        success: false,
        message: `Resource '${asset.name}' is currently '${asset.status}' and cannot be reserved.`
      });
    }

    // Business rule: Check for overlapping APPROVED bookings
    const overlappingBooking = await Booking.findOne({
      asset: assetId,
      status: 'Approved',
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: `Resource '${asset.name}' is already booked and approved during the selected time period (${new Date(overlappingBooking.startDate).toLocaleString()} to ${new Date(overlappingBooking.endDate).toLocaleString()}). Please choose another time slot.`
      });
    }

    const booking = await Booking.create({
      asset: assetId,
      requestedBy: req.user._id,
      startDate: start,
      endDate: end,
      purpose: purpose.trim(),
      status: 'Pending'
    });

    await logAudit({
      user: req.user,
      action: 'BOOKING_REQUESTED',
      module: 'BOOKINGS',
      targetId: booking._id,
      targetName: `${asset.name} reserved for ${purpose.trim()}`,
      details: { startDate: start, endDate: end, purpose },
      ipAddress: req.ip
    });

    const populated = await Booking.findById(booking._id)
      .populate('asset')
      .populate('requestedBy', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. Awaiting manager approval.',
      booking: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject booking request
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin, Manager)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Approved' or 'Rejected'."
      });
    }

    const booking = await Booking.findById(req.params.id).populate('asset');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update booking that is already '${booking.status}'.`
      });
    }

    // If approving, re-check overlap with other approved bookings
    if (status === 'Approved') {
      const overlap = await Booking.findOne({
        _id: { $ne: booking._id },
        asset: booking.asset._id,
        status: 'Approved',
        $or: [
          { startDate: { $lt: booking.endDate }, endDate: { $gt: booking.startDate } }
        ]
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve booking: another booking for this resource is already approved during this period.'
        });
      }
    }

    booking.status = status;
    booking.reviewedBy = req.user._id;
    booking.reviewNotes = reviewNotes || '';
    await booking.save();

    await logAudit({
      user: req.user,
      action: status === 'Approved' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
      module: 'BOOKINGS',
      targetId: booking._id,
      targetName: `${booking.asset?.name || 'Resource'} booking ${status.toLowerCase()}`,
      details: { reviewNotes },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Booking request ${status.toLowerCase()} successfully.`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking request
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Owner, Admin)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Employees can only cancel their own bookings
    if (
      req.user.role === 'EMPLOYEE' &&
      booking.requestedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings.'
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled.'
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    await logAudit({
      user: req.user,
      action: 'BOOKING_CANCELLED',
      module: 'BOOKINGS',
      targetId: booking._id,
      targetName: 'Booking cancelled by user',
      details: {},
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking
};
