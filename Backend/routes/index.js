const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const tagRoutes = require('./tagRoutes');
const uploadRoutes = require('./uploadRoutes');
const mediaRoutes = require('./mediaRoutes');
const articleRoutes = require('./articleRoutes');
const albumRoutes = require('./albumRoutes');
const videoRoutes = require('./videoRoutes');
const { authenticate, authorize } = require('../middleware/auth');

// Welcome / health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running and healthy.',
    timestamp: new Date()
  });
});

// Mount specific sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/upload', uploadRoutes);
router.use('/media', mediaRoutes);
router.use('/articles', articleRoutes);
router.use('/albums', albumRoutes);
router.use('/videos', videoRoutes);

// Register dynamic admin features routes
router.use('/live-updates', require('./liveUpdateRoutes'));
router.use('/epaper', require('./epaperRoutes'));
router.use('/markets', require('./settingRoutes'));

// Role-Based Access Control Example Routes (Demonstrating Step 7)

// 1. Only Super Admin
router.get(
  '/admin/dashboard',
  authenticate,
  authorize('super_admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Super Admin Dashboard!',
      user: req.user
    });
  }
);

// 2. Only Editor
router.get(
  '/editor/dashboard',
  authenticate,
  authorize('super_admin', 'editor'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Editor Panel!',
      user: req.user
    });
  }
);

// 3. Only Reporter
router.get(
  '/reporter/dashboard',
  authenticate,
  authorize('super_admin', 'reporter'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Reporter Workspace!',
      user: req.user
    });
  }
);

// 4. Only SEO Manager
router.get(
  '/seo/dashboard',
  authenticate,
  authorize('super_admin', 'seo'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the SEO Optimization Desk!',
      user: req.user
    });
  }
);

// 5. Only Advertisement Manager
router.get(
  '/ads/dashboard',
  authenticate,
  authorize('super_admin', 'advertisement'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Advertising Panel!',
      user: req.user
    });
  }
);

// 6. Only Photographer
router.get(
  '/photos/dashboard',
  authenticate,
  authorize('super_admin', 'photographer'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Photo Upload Center!',
      user: req.user
    });
  }
);

module.exports = router;
