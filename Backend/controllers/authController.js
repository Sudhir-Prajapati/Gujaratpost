const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword
} = require('../utils/helpers');
const sendEmail = require('../utils/sendEmail');

// Helper to set HttpOnly refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password.'
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

    // Create user in database
    const userId = await UserModel.create({
      username,
      email,
      password: hashedPassword
    });

    // Retrieve the fully populated user profile
    const newUser = await UserModel.findById(userId);

    // Generate tokens
    const accessToken = generateAccessToken(newUser.id, newUser.email, newUser.role);
    const refreshToken = generateRefreshToken(newUser.id, newUser.email, newUser.role);

    // Save refresh token to database
    await UserModel.updateRefreshToken(newUser.id, refreshToken);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact the administrator.'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    // Save refresh token to database
    await UserModel.updateRefreshToken(user.id, refreshToken);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully.',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing.'
      });
    }

    // Find user in database with this refresh token
    const user = await UserModel.findByRefreshToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact the administrator.'
      });
    }

    // Verify refresh token signature
    try {
      jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me_in_production'
      );
    } catch (err) {
      // Clear token from DB if expired/compromised
      await UserModel.updateRefreshToken(user.id, null);
      res.clearCookie('refreshToken');
      return res.status(403).json({
        success: false,
        message: 'Refresh token validation failed or expired.'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      data: {
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const user = await UserModel.findByRefreshToken(token);
      if (user) {
        // Clear refresh token in DB
        await UserModel.updateRefreshToken(user.id, null);
      }
    }

    // Clear client cookies
    res.clearCookie('refreshToken');
    res.clearCookie('token'); // Legacy/Authorization fallback cookie

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.'
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Return 200 for security to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset link was sent.'
      });
    }

    // Create a 40-character hex token
    const resetToken = crypto.randomBytes(20).toString('hex');
    // Set expiry to 1 hour from now
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    // Save reset details to DB
    await UserModel.updateResetToken(user.id, resetToken, expiresAt);

    // Build reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const textMessage = `You requested a password reset. Please make a POST request with the new password to: \n\n ${resetUrl}`;
    const htmlMessage = `
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: textMessage,
        html: htmlMessage
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email.'
      });
    } catch (err) {
      // Clear token from DB if email dispatch failed
      await UserModel.updateResetToken(user.id, null, null);
      console.error('Email dispatch error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Password reset email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid token and password.'
      });
    }

    // Look up user by valid token
    const user = await UserModel.findByResetToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset columns
    await UserModel.updatePassword(user.id, hashedPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset completed successfully. You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for authenticated user
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.'
      });
    }

    // Fetch user from DB including the hashed password
    const user = await UserModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Match current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in DB
    await UserModel.updatePassword(user.id, hashedPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword
};
