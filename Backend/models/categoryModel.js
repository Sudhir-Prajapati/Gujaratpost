const db = require('../config/db');

class CategoryModel {
  /**
   * Fetch all categories
   * @returns {Promise<Object[]>}
   */
  static async findAll() {
    try {
      const query = `
        SELECT c.*,
               COALESCE(ac.article_count, 0) AS article_count
        FROM categories c
        LEFT JOIN (
          SELECT category_id, COUNT(*) AS article_count
          FROM articles
          WHERE status = 'published'
          GROUP BY category_id
        ) ac ON c.id = ac.category_id
        ORDER BY c.name ASC
      `;
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in CategoryModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Find a category by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM categories WHERE id = ? LIMIT 1';
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in CategoryModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Find a category by Slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    try {
      const query = 'SELECT * FROM categories WHERE slug = ? LIMIT 1';
      const [rows] = await db.execute(query, [slug]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in CategoryModel.findBySlug:', error.message);
      throw error;
    }
  }

  /**
   * Create a new category
   * @param {Object} categoryData
   * @param {string} categoryData.name
   * @param {string} categoryData.slug
   * @param {string} [categoryData.description]
   * @returns {Promise<number>} Inserted category ID
   */
  static async create({ name, slug, description = null, is_location = 0 }) {
    try {
      const query = 'INSERT INTO categories (name, slug, description, is_location) VALUES (?, ?, ?, ?)';
      const [result] = await db.execute(query, [name, slug, description, is_location]);
      return result.insertId;
    } catch (error) {
      console.error('Error in CategoryModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Update category details
   * @param {number|string} id
   * @param {Object} categoryData
   * @param {string} [categoryData.name]
   * @param {string} [categoryData.slug]
   * @param {string} [categoryData.description]
   * @returns {Promise<boolean>} True if updated
   */
  static async update(id, { name, slug, description, is_location }) {
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
      if (description !== undefined) {
        fields.push('description = ?');
        values.push(description);
      }
      if (is_location !== undefined) {
        fields.push('is_location = ?');
        values.push(is_location);
      }

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in CategoryModel.update:', error.message);
      throw error;
    }
  }

  /**
   * Delete a category by ID
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM categories WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in CategoryModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = CategoryModel;
