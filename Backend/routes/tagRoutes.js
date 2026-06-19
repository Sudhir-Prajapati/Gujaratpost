const express = require('express');
const router = express.Router();
const {
  listTags,
  getTag,
  createTag,
  updateTag,
  deleteTag
} = require('../controllers/tagController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', listTags);
router.get('/:idOrSlug', getTag);

// Protected routes:
// 1. super_admin, editor, and reporter can create tags
router.post('/', protect, authorize('super_admin', 'editor', 'reporter'), createTag);

// 2. Only super_admin and editor can update/delete tags
router.put('/:id', protect, authorize('super_admin', 'editor'), updateTag);
router.delete('/:id', protect, authorize('super_admin', 'editor'), deleteTag);

module.exports = router;
