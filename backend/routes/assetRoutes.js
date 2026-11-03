const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetQRCode
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAssets)
  .post(authorize('ADMIN', 'MANAGER'), createAsset);

router
  .route('/:id')
  .get(getAssetById)
  .put(authorize('ADMIN', 'MANAGER'), updateAsset)
  .delete(authorize('ADMIN'), deleteAsset);

router.get('/:id/qrcode', getAssetQRCode);

module.exports = router;
