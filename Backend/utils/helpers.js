const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Generate Access Token (Short-lived)
 * @param {string|number} id
 * @param {string} email
 * @param {string} role
 * @returns {string} JWT Token
 */
const generateAccessToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Generate Refresh Token (Long-lived)
 * @param {string|number} id
 * @param {string} email
 * @param {string} role
 * @returns {string} JWT Token
 */
const generateRefreshToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me_in_production',
    { expiresIn: '7d' } // 7 days
  );
};

// Kept for backward compatibility
const generateToken = (id, email, role) => {
  return generateAccessToken(id, email, role);
};

/**
 * Hash password helper
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password helper
 * @param {string} password
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text
 * @returns {string} Slug
 */
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  hashPassword,
  comparePassword,
  slugify
};
