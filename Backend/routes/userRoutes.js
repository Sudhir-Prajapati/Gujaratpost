const express = require('express');
const router = express.Router();
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, hasPermission } = require('../middleware/auth');

// All user management routes require authenticated session with 'manage_users' permission
router.use(protect);
router.use(hasPermission('manage_users'));

router.route('/')
  .get(listUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
