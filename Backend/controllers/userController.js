const UserModel = require('../models/userModel');
const { hashPassword } = require('../utils/helpers');

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return password.length >= 8 && hasUpper && hasLower && hasDigit && hasSpecial;
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Requires manage_users permission)
const listUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Requires manage_users permission)
const createUser = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password.'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one unique character.'
      });
    }

    if (role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'You cannot assign the Regular User role from this panel.'
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    // Fetch complete user profile (excluding password)
    const newUser = await UserModel.findById(userId);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: newUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Requires manage_users permission)
const updateUser = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const currentUserId = req.user.id;
  const { username, email, role, is_blocked, password } = req.body;

  try {
    // 1. Fetch the user to be updated
    const userToUpdate = await UserModel.findById(targetId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // 2. Prevent self-lockout checks
    if (targetId === currentUserId) {
      // Prevent blocking oneself
      if (is_blocked !== undefined && (is_blocked === true || is_blocked === 1)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot block yourself.'
        });
      }
      
      // Prevent changing one's own role (demoting oneself)
      if (role !== undefined && role !== userToUpdate.role) {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own role.'
        });
      }
    }

    // 3. Resolve role string to role ID if changing role
    let roleId = undefined;
    if (role !== undefined) {
      roleId = await UserModel.getRoleIdByName(role);
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: `Invalid role name: ${role}.`
        });
      }
    }

    // 4. Handle email uniqueness check if changing email
    if (email !== undefined && email.toLowerCase() !== userToUpdate.email.toLowerCase()) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address.'
        });
      }
      const existingEmailUser = await UserModel.findByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists.'
        });
      }
    }

    if (role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'You cannot assign the Regular User role from this panel.'
      });
    }

    // 5. Build dynamic update variables
    // Normalize is_blocked to number if provided
    let isBlockedVal = undefined;
    if (is_blocked !== undefined) {
      isBlockedVal = (is_blocked === true || is_blocked === 1 || is_blocked === '1') ? 1 : 0;
    }

    await UserModel.update(targetId, {
      username,
      email,
      roleId,
      is_blocked: isBlockedVal
    });

    // Hash and update password if passed
    if (password && password.trim() !== '') {
      if (!validatePassword(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one unique character.'
        });
      }
      const hashedPassword = await hashPassword(password);
      await UserModel.updatePassword(targetId, hashedPassword);
    }

    // 6. Fetch and return fresh updated profile
    const updatedUser = await UserModel.findById(targetId);
    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Requires manage_users permission)
const deleteUser = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const currentUserId = req.user.id;

  try {
    // 1. Prevent self-deletion
    if (targetId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself.'
      });
    }

    // 2. Check user exists
    const userToDelete = await UserModel.findById(targetId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // 3. Execute delete
    await UserModel.delete(targetId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser
};
