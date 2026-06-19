const db = require('../config/db');

class UserModel {
  /**
   * Helper to fetch permission names for a given role ID
   * @param {number} roleId
   * @returns {Promise<string[]>} List of permission names
   */
  static async getPermissionsByRoleId(roleId) {
    if (!roleId) return [];
    try {
      const query = `
        SELECT p.name 
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `;
      const [rows] = await db.execute(query, [roleId]);
      return rows.map((row) => row.name);
    } catch (error) {
      console.error('Error in UserModel.getPermissionsByRoleId:', error.message);
      return [];
    }
  }

  /**
   * Helper to fetch role ID by name
   * @param {string} roleName
   * @returns {Promise<number|null>}
   */
  static async getRoleIdByName(roleName) {
    try {
      const query = 'SELECT id FROM roles WHERE name = ? LIMIT 1';
      const [rows] = await db.execute(query, [roleName]);
      return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
      console.error('Error in UserModel.getRoleIdByName:', error.message);
      return null;
    }
  }

  /**
   * Find a user by email, joining role name and loading permissions
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    try {
      const query = `
        SELECT u.*, r.name AS role 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [email]);
      if (rows.length === 0) return null;

      const user = rows[0];
      user.permissions = await this.getPermissionsByRoleId(user.role_id);
      return user;
    } catch (error) {
      console.error('Error in UserModel.findByEmail:', error.message);
      throw error;
    }
  }

  /**
   * Find a user by ID, joining role name and loading permissions
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT u.id, u.username, u.email, u.role_id, r.name AS role, u.is_blocked, u.created_at 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [id]);
      if (rows.length === 0) return null;

      const user = rows[0];
      user.permissions = await this.getPermissionsByRoleId(user.role_id);
      return user;
    } catch (error) {
      console.error('Error in UserModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Create a new user, resolving their string role to a role_id
   * @param {Object} userData
   * @param {string} userData.username
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {string} [userData.role] - String name of role (e.g. 'user', 'admin')
   * @returns {Promise<number>} Inserted user ID
   */
  static async create({ username, email, password, role = 'user' }) {
    try {
      // Resolve string role to role_id
      let roleId = await this.getRoleIdByName(role);
      if (!roleId) {
        // Fallback to regular user role ID
        roleId = await this.getRoleIdByName('user');
      }

      const query =
        'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)';
      const [result] = await db.execute(query, [
        username,
        email,
        password,
        roleId
      ]);
      return result.insertId;
    } catch (error) {
      console.error('Error in UserModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Update user's refresh token in DB
   * @param {number|string} userId
   * @param {string|null} refreshToken
   */
  static async updateRefreshToken(userId, refreshToken) {
    try {
      const query = 'UPDATE users SET refresh_token = ? WHERE id = ?';
      await db.execute(query, [refreshToken, userId]);
    } catch (error) {
      console.error('Error in UserModel.updateRefreshToken:', error.message);
      throw error;
    }
  }

  /**
   * Find user by active refresh token
   * @param {string} refreshToken
   * @returns {Promise<Object|null>}
   */
  static async findByRefreshToken(refreshToken) {
    try {
      const query = `
        SELECT u.*, r.name AS role 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.refresh_token = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [refreshToken]);
      if (rows.length === 0) return null;

      const user = rows[0];
      user.permissions = await this.getPermissionsByRoleId(user.role_id);
      return user;
    } catch (error) {
      console.error('Error in UserModel.findByRefreshToken:', error.message);
      throw error;
    }
  }

  /**
   * Set password reset token and expiration
   * @param {number|string} userId
   * @param {string|null} resetToken
   * @param {Date|null} expiresAt
   */
  static async updateResetToken(userId, resetToken, expiresAt) {
    try {
      const query =
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?';
      await db.execute(query, [resetToken, expiresAt, userId]);
    } catch (error) {
      console.error('Error in UserModel.updateResetToken:', error.message);
      throw error;
    }
  }

  /**
   * Find user by password reset token if not expired
   * @param {string} resetToken
   * @returns {Promise<Object|null>}
   */
  static async findByResetToken(resetToken) {
    try {
      const query = `
        SELECT u.*, r.name AS role 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.reset_token = ? AND u.reset_token_expires > NOW() LIMIT 1
      `;
      const [rows] = await db.execute(query, [resetToken]);
      if (rows.length === 0) return null;

      const user = rows[0];
      user.permissions = await this.getPermissionsByRoleId(user.role_id);
      return user;
    } catch (error) {
      console.error('Error in UserModel.findByResetToken:', error.message);
      throw error;
    }
  }

  /**
   * Update password and clear reset token columns
   * @param {number|string} userId
   * @param {string} hashedPassword
   */
  static async updatePassword(userId, hashedPassword) {
    try {
      const query = `
        UPDATE users 
        SET password = ?, reset_token = NULL, reset_token_expires = NULL 
        WHERE id = ?
      `;
      await db.execute(query, [hashedPassword, userId]);
    } catch (error) {
      console.error('Error in UserModel.updatePassword:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all users joined with role names
   * @returns {Promise<Object[]>} List of all users
   */
  static async findAll() {
    try {
      const query = `
        SELECT u.id, u.username, u.email, u.role_id, r.name AS role, u.is_blocked, u.created_at 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        ORDER BY u.created_at DESC
      `;
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in UserModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Dynamically update user details
   * @param {number|string} id
   * @param {Object} updateData
   * @param {string} [updateData.username]
   * @param {string} [updateData.email]
   * @param {number|null} [updateData.roleId]
   * @param {number} [updateData.is_blocked]
   * @returns {Promise<boolean>} True if any row was affected
   */
  static async update(id, { username, email, roleId, is_blocked }) {
    try {
      const fields = [];
      const values = [];

      if (username !== undefined) {
        fields.push('username = ?');
        values.push(username);
      }
      if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
      }
      if (roleId !== undefined) {
        fields.push('role_id = ?');
        values.push(roleId);
      }
      if (is_blocked !== undefined) {
        fields.push('is_blocked = ?');
        values.push(is_blocked);
      }

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in UserModel.update:', error.message);
      throw error;
    }
  }

  /**
   * Delete a user by ID
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in UserModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = UserModel;
