const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getEmployees)
  .post(authorize('ADMIN', 'MANAGER'), createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(authorize('ADMIN', 'MANAGER'), updateEmployee)
  .delete(authorize('ADMIN'), deleteEmployee);

module.exports = router;
