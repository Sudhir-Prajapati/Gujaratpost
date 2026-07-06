const express = require('express');
const router = express.Router();
const {
  listAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum
} = require('../controllers/albumController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', listAlbums);
router.get('/:idOrSlug', getAlbum);

// Protected routes (Only super_admin, editor, photographer can write)
router.post('/', protect, authorize('super_admin', 'editor', 'photographer'), createAlbum);
router.put('/:id', protect, authorize('super_admin', 'editor', 'photographer'), updateAlbum);
router.delete('/:id', protect, authorize('super_admin', 'editor', 'photographer'), deleteAlbum);

module.exports = router;
