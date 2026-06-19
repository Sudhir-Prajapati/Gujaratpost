const db = require('../config/db');

class EpaperModel {
  static async findAll() {
    try {
      const query = 'SELECT * FROM epapers ORDER BY publish_date DESC, id DESC';
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in EpaperModel.findAll:', error.message);
      throw error;
    }
  }

  static async findLatest() {
    try {
      const query = 'SELECT * FROM epapers ORDER BY publish_date DESC, id DESC LIMIT 1';
      const [rows] = await db.execute(query);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in EpaperModel.findLatest:', error.message);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM epapers WHERE id = ? LIMIT 1';
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in EpaperModel.findById:', error.message);
      throw error;
    }
  }

  static async create({ title, thumbnail_path, pdf_path, publish_date }) {
    try {
      const query = 'INSERT INTO epapers (title, thumbnail_path, pdf_path, publish_date) VALUES (?, ?, ?, ?)';
      const [result] = await db.execute(query, [title, thumbnail_path, pdf_path, publish_date]);
      return result.insertId;
    } catch (error) {
      console.error('Error in EpaperModel.create:', error.message);
      throw error;
    }
  }

  static async update(id, { title, thumbnail_path, pdf_path, publish_date }) {
    try {
      const fields = [];
      const values = [];

      if (title !== undefined) {
        fields.push('title = ?');
        values.push(title);
      }
      if (thumbnail_path !== undefined) {
        fields.push('thumbnail_path = ?');
        values.push(thumbnail_path);
      }
      if (pdf_path !== undefined) {
        fields.push('pdf_path = ?');
        values.push(pdf_path);
      }
      if (publish_date !== undefined) {
        fields.push('publish_date = ?');
        values.push(publish_date);
      }

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE epapers SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in EpaperModel.update:', error.message);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM epapers WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in EpaperModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = EpaperModel;
