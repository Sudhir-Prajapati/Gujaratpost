const db = require('../config/db');

class AlbumModel {
  /**
   * Fetch all albums
   * @returns {Promise<Object[]>}
   */
  static async findAll() {
    try {
      const query = `
        SELECT a.*, m.filepath AS cover_image_path
        FROM albums a
        LEFT JOIN media m ON a.cover_image_id = m.id
        ORDER BY a.created_at DESC
      `;
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in AlbumModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Find an album by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT a.*, m.filepath AS cover_image_path
        FROM albums a
        LEFT JOIN media m ON a.cover_image_id = m.id
        WHERE a.id = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [id]);
      if (rows.length === 0) return null;
      const album = rows[0];
      album.images = await this.getAlbumImages(album.id);
      return album;
    } catch (error) {
      console.error('Error in AlbumModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Find an album by Slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT a.*, m.filepath AS cover_image_path
        FROM albums a
        LEFT JOIN media m ON a.cover_image_id = m.id
        WHERE a.slug = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [slug]);
      if (rows.length === 0) return null;
      const album = rows[0];
      album.images = await this.getAlbumImages(album.id);
      return album;
    } catch (error) {
      console.error('Error in AlbumModel.findBySlug:', error.message);
      throw error;
    }
  }

  /**
   * Helper to retrieve all image objects for an album
   * @param {number} albumId
   * @returns {Promise<Object[]>}
   */
  static async getAlbumImages(albumId) {
    try {
      const query = `
        SELECT ai.id AS association_id, ai.caption, ai.sort_order,
               m.id AS id, m.filename, m.filepath, m.filetype, m.mime_type, m.size, m.created_at
        FROM album_images ai
        INNER JOIN media m ON ai.media_id = m.id
        WHERE ai.album_id = ?
        ORDER BY ai.sort_order ASC, ai.id ASC
      `;
      const [rows] = await db.execute(query, [albumId]);
      return rows;
    } catch (error) {
      console.error('Error in AlbumModel.getAlbumImages:', error.message);
      return [];
    }
  }

  /**
   * Create a new album
   * @param {Object} albumData
   * @param {string} albumData.title
   * @param {string} albumData.slug
   * @param {string} [albumData.description]
   * @param {number|null} [albumData.cover_image_id]
   * @returns {Promise<number>} Inserted album ID
   */
  static async create({ title, slug, description = null, cover_image_id = null }) {
    try {
      const query = `
        INSERT INTO albums (title, slug, description, cover_image_id) 
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await db.execute(query, [title, slug, description, cover_image_id]);
      return result.insertId;
    } catch (error) {
      console.error('Error in AlbumModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Update album metadata details dynamically
   * @param {number|string} id
   * @param {Object} albumData
   * @returns {Promise<boolean>} True if updated
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      const keys = ['title', 'slug', 'description', 'cover_image_id'];

      keys.forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE albums SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in AlbumModel.update:', error.message);
      throw error;
    }
  }

  /**
   * Sync junction table for album images
   * @param {number} albumId
   * @param {Object[]} imagesData List of image details
   * @param {number} imagesData[].media_id
   * @param {string} [imagesData[].caption]
   * @param {number} [imagesData[].sort_order]
   */
  static async syncImages(albumId, imagesData = []) {
    try {
      // 1. Delete existing associations
      await db.execute('DELETE FROM album_images WHERE album_id = ?', [albumId]);

      // 2. Insert new associations
      if (imagesData.length > 0) {
        const placeholders = imagesData.map(() => '(?, ?, ?, ?)').join(', ');
        const values = [];
        imagesData.forEach(img => {
          values.push(albumId, img.media_id, img.caption || null, img.sort_order || 0);
        });

        const query = `INSERT INTO album_images (album_id, media_id, caption, sort_order) VALUES ${placeholders}`;
        await db.execute(query, values);
      }
    } catch (error) {
      console.error('Error in AlbumModel.syncImages:', error.message);
      throw error;
    }
  }

  /**
   * Delete an album
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM albums WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in AlbumModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = AlbumModel;
