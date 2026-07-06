const db = require('../config/db');

class MediaModel {
  /**
   * Create a new media record
   * @param {Object} mediaData
   * @param {string} mediaData.filename
   * @param {string} mediaData.filepath
   * @param {string} mediaData.filetype
   * @param {string} mediaData.mime_type
   * @param {number} mediaData.size
   * @param {number|null} mediaData.user_id
   * @returns {Promise<number>} Inserted media ID
   */
  static async create({ filename, filepath, filetype, mime_type, size, user_id = null }) {
    try {
      const query = `
        INSERT INTO media (filename, filepath, filetype, mime_type, size, user_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.execute(query, [filename, filepath, filetype, mime_type, size, user_id]);
      return result.insertId;
    } catch (error) {
      console.error('Error in MediaModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all media records joined with the uploader's username
   * @returns {Promise<Object[]>}
   */
  static async findAll() {
    try {
      const query = `
        SELECT m.*, u.username AS uploaded_by 
        FROM media m 
        LEFT JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at DESC
      `;
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in MediaModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Find a single media record by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM media WHERE id = ? LIMIT 1';
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in MediaModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Delete a media record by ID
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM media WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in MediaModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = MediaModel;
