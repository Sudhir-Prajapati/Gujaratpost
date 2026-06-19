const express = require('express');
const router = express.Router();
const {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', listCategories);
router.get('/:idOrSlug', getCategory);

// Protected routes (Only super_admin and editor can create/update/delete categories)
router.post('/', protect, authorize('super_admin', 'editor'), createCategory);
router.put('/:id', protect, authorize('super_admin', 'editor'), updateCategory);
router.delete('/:id', protect, authorize('super_admin', 'editor'), deleteCategory);

module.exports = router;
