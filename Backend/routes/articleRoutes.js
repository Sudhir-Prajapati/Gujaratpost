const express = require('express');
const router = express.Router();
const {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  approveArticle,
  rejectArticle,
  publishArticle,
  unpublishArticle
} = require('../controllers/articleController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (Internal auth parsing handles role-based view limits)
router.get('/', listArticles);
router.get('/:id', getArticle);

// Protected routes (Require login and either admin, editor, or reporter role)
router.post('/', protect, authorize('super_admin', 'editor', 'reporter'), createArticle);
router.put('/:id', protect, authorize('super_admin', 'editor', 'reporter'), updateArticle);
router.delete('/:id', protect, authorize('super_admin', 'editor', 'reporter'), deleteArticle);

// Transition routes (restricted to admins and editors only)
router.put('/:id/approve', protect, authorize('super_admin', 'editor'), approveArticle);
router.put('/:id/reject', protect, authorize('super_admin', 'editor'), rejectArticle);
router.put('/:id/publish', protect, authorize('super_admin', 'editor'), publishArticle);
router.put('/:id/unpublish', protect, authorize('super_admin', 'editor'), unpublishArticle);

module.exports = router;
