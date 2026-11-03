const express = require('express');
const router = express.Router();
const {
  getMaintenanceRecords,
  createMaintenanceRequest,
  updateMaintenanceRecord
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getMaintenanceRecords)
  .post(createMaintenanceRequest);

router.put('/:id', authorize('ADMIN', 'MANAGER'), updateMaintenanceRecord);

module.exports = router;
