const express = require('express');
const router = express.Router();
const {
  listLiveUpdates,
  createLiveUpdate,
  updateLiveUpdate,
  deleteLiveUpdate
} = require('../controllers/liveUpdateController');
const { protect, authorize } = require('../middleware/auth');

// Public route to fetch updates
router.get('/', listLiveUpdates);

// Protected administrative management routes
router.use(protect);
router.use(authorize('super_admin', 'editor'));

router.post('/', createLiveUpdate);
router.route('/:id')
  .put(updateLiveUpdate)
  .delete(deleteLiveUpdate);

module.exports = router;
