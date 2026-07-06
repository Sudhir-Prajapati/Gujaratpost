const express = require('express');
const router = express.Router();
const {
  listEpapers,
  getLatestEpaper,
  createEpaper,
  deleteEpaper
} = require('../controllers/epaperController');
const { protect, authorize } = require('../middleware/auth');
const { uploadEpaperFiles } = require('../middleware/upload');

// Public routes
router.get('/', listEpapers);
router.get('/latest', getLatestEpaper);

// Protected routes
router.post(
  '/',
  protect,
  authorize('super_admin', 'editor'),
  uploadEpaperFiles.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  createEpaper
);

router.delete('/:id', protect, authorize('super_admin', 'editor'), deleteEpaper);

module.exports = router;
