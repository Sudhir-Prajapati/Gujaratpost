const express = require('express');
const router = express.Router();
const { listMedia, deleteMedia } = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/auth');

// Protect all library routes
router.use(protect);

// 1. GET /media: restricted to admins and uploader/optimized staff roles
router.get('/', authorize('super_admin', 'editor', 'reporter', 'photographer', 'seo', 'advertisement'), listMedia);

// 2. DELETE /media/:id: handled internally for ownership / admin authorization
router.delete('/:id', deleteMedia);

module.exports = router;
