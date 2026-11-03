const express = require('express');
const router = express.Router();
const {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getBookings)
  .post(createBooking);

router.put('/:id/status', authorize('ADMIN', 'MANAGER'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
