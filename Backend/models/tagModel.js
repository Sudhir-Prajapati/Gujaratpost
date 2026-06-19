const db = require('../config/db');

class TagModel {
  /**
   * Fetch all tags
   * @returns {Promise<Object[]>}
   */
  static async findAll() {
    try {
      const query = 'SELECT * FROM tags ORDER BY name ASC';
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in TagModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Find a tag by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM tags WHERE id = ? LIMIT 1';
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in TagModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Find a tag by Slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    try {
      const query = 'SELECT * FROM tags WHERE slug = ? LIMIT 1';
      const [rows] = await db.execute(query, [slug]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in TagModel.findBySlug:', error.message);
      throw error;
    }
  }

  /**
   * Create a new tag
   * @param {Object} tagData
   * @param {string} tagData.name
   * @param {string} tagData.slug
   * @returns {Promise<number>} Inserted tag ID
   */
  static async create({ name, slug }) {
    try {
      const query = 'INSERT INTO tags (name, slug) VALUES (?, ?)';
      const [result] = await db.execute(query, [name, slug]);
      return result.insertId;
    } catch (error) {
      console.error('Error in TagModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Update tag details
   * @param {number|string} id
   * @param {Object} tagData
   * @param {string} [tagData.name]
   * @param {string} [tagData.slug]
   * @returns {Promise<boolean>} True if updated
   */
  static async update(id, { name, slug }) {
    try {
      const fields = [];
      const values = [];

      if (name !== undefined) {
        fields.push('name = ?');
        values.push(name);
      }
      if (slug !== undefined) {
        fields.push('slug = ?');
        values.push(slug);
      }

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in TagModel.update:', error.message);
      throw error;
    }
  }

  /**
   * Delete a tag by ID
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM tags WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in TagModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = TagModel;
