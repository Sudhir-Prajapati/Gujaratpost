const db = require('../config/db');

class VideoModel {
  /**
   * Fetch all videos
   * @returns {Promise<Object[]>}
   */
  static async findAll() {
    try {
      const query = `
        SELECT v.*, m.filepath AS thumbnail_image_path
        FROM videos v
        LEFT JOIN media m ON v.thumbnail_image_id = m.id
        ORDER BY v.created_at DESC
      `;
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in VideoModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Find a video by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT v.*, m.filepath AS thumbnail_image_path
        FROM videos v
        LEFT JOIN media m ON v.thumbnail_image_id = m.id
        WHERE v.id = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in VideoModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Find a video by Slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT v.*, m.filepath AS thumbnail_image_path
        FROM videos v
        LEFT JOIN media m ON v.thumbnail_image_id = m.id
        WHERE v.slug = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [slug]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in VideoModel.findBySlug:', error.message);
      throw error;
    }
  }

  /**
   * Create a new video entry
   * @param {Object} videoData
   * @param {string} videoData.title
   * @param {string} videoData.slug
   * @param {string} [videoData.description]
   * @param {string} videoData.video_type 'youtube'|'local'
   * @param {string} videoData.video_url
   * @param {string|null} [videoData.youtube_video_id]
   * @param {number|null} [videoData.thumbnail_image_id]
   * @returns {Promise<number>} Inserted video ID
   */
  static async create({
    title,
    slug,
    description = null,
    video_type,
    video_url,
    youtube_video_id = null,
    thumbnail_image_id = null
  }) {
    try {
      const query = `
        INSERT INTO videos (title, slug, description, video_type, video_url, youtube_video_id, thumbnail_image_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.execute(query, [
        title,
        slug,
        description,
        video_type,
        video_url,
        youtube_video_id,
        thumbnail_image_id
      ]);
      return result.insertId;
    } catch (error) {
      console.error('Error in VideoModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Update video details dynamically
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<boolean>} True if updated
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      const keys = [
        'title',
        'slug',
        'description',
        'video_type',
        'video_url',
        'youtube_video_id',
        'thumbnail_image_id'
      ];

      keys.forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE videos SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in VideoModel.update:', error.message);
      throw error;
    }
  }

  /**
   * Delete a video
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM videos WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in VideoModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = VideoModel;
