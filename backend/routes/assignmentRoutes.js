const express = require('express');
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  returnAssignment
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAssignments)
  .post(authorize('ADMIN', 'MANAGER'), createAssignment);

router.post('/:id/return', authorize('ADMIN', 'MANAGER'), returnAssignment);

module.exports = router;
