const express = require('express');
const router = express.Router();
const {
  listVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo
} = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', listVideos);
router.get('/:idOrSlug', getVideo);

// Protected routes (Only super_admin, editor, reporter, photographer can write)
router.post('/', protect, authorize('super_admin', 'editor', 'reporter', 'photographer'), createVideo);
router.put('/:id', protect, authorize('super_admin', 'editor', 'reporter', 'photographer'), updateVideo);
router.delete('/:id', protect, authorize('super_admin', 'editor', 'reporter', 'photographer'), deleteVideo);

module.exports = router;
