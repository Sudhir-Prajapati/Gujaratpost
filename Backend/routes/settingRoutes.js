const express = require('express');
const router = express.Router();
const {
  fetchLiveRates,
  getSettings,
  updateSettings
} = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

// Public route to get aggregate rates
router.get('/live-rates', fetchLiveRates);

// Protected routes to manage settings (override indices, update API keys)
router.use(protect);
router.use(authorize('super_admin', 'editor'));

router.route('/settings')
  .get(getSettings)
  .post(updateSettings);

module.exports = router;
