const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Authenticate middleware (validates JWT and attaches fresh user details + permissions)
const authenticate = async (req, res, next) => {
  let token;

  // Check header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.cookies && req.cookies.refreshToken) {
    // Fallback or session check
    token = req.cookies.refreshToken;
  }

  // If no token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing.'
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production'
    );

    // Retrieve fresh user details and permissions from the database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user no longer exists.'
      });
    }

    // Check if the user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact the administrator.'
      });
    }

    // Attach complete user object (id, username, email, role, permissions) to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token validation failed or expired.'
    });
  }
};

// Protect routes middleware (alias for authenticate to preserve backward compatibility)
const protect = authenticate;

// Authorize role middleware (checks if user role matches allowed roles)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please log in.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

// Check permissions middleware (checks if user has all required permissions)
const hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please log in.'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires permission: ${requiredPermissions.join(' and ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  protect,
  authorize,
  hasPermission
};
