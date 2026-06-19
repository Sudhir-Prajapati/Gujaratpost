const db = require('../config/db');

class LiveUpdateModel {
  static async findAll() {
    try {
      const query = 'SELECT * FROM live_updates ORDER BY id DESC';
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in LiveUpdateModel.findAll:', error.message);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM live_updates WHERE id = ? LIMIT 1';
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in LiveUpdateModel.findById:', error.message);
      throw error;
    }
  }

  static async create({ time_text, title, is_alert = 0, youtube_url = null }) {
    try {
      const query = 'INSERT INTO live_updates (time_text, title, is_alert, youtube_url) VALUES (?, ?, ?, ?)';
      const [result] = await db.execute(query, [time_text, title, is_alert, youtube_url]);
      return result.insertId;
    } catch (error) {
      console.error('Error in LiveUpdateModel.create:', error.message);
      throw error;
    }
  }

  static async update(id, { time_text, title, is_alert, youtube_url }) {
    try {
      const fields = [];
      const values = [];

      if (time_text !== undefined) {
        fields.push('time_text = ?');
        values.push(time_text);
      }
      if (title !== undefined) {
        fields.push('title = ?');
        values.push(title);
      }
      if (is_alert !== undefined) {
        fields.push('is_alert = ?');
        values.push(is_alert);
      }
      if (youtube_url !== undefined) {
        fields.push('youtube_url = ?');
        values.push(youtube_url);
      }

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE live_updates SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in LiveUpdateModel.update:', error.message);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM live_updates WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in LiveUpdateModel.delete:', error.message);
      throw error;
    }
  }
}

module.exports = LiveUpdateModel;
