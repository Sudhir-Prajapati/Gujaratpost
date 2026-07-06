const express = require('express');
const router = express.Router();
const { uploadImageFile, uploadVideoFile } = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadVideo } = require('../middleware/upload');

// All upload routes require authenticated administrative staff
router.use(protect);
router.use(authorize('super_admin', 'editor', 'reporter', 'photographer'));

// Handle image upload
router.post('/image', uploadImage.single('image'), uploadImageFile);

// Handle video upload
router.post('/video', uploadVideo.single('video'), uploadVideoFile);

module.exports = router;
