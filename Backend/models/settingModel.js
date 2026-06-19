const db = require('../config/db');

class SettingModel {
  static async get(key) {
    try {
      const query = 'SELECT `value` FROM settings WHERE `key` = ? LIMIT 1';
      const [rows] = await db.execute(query, [key]);
      return rows.length > 0 ? rows[0].value : null;
    } catch (error) {
      console.error(`Error in SettingModel.get for key ${key}:`, error.message);
      throw error;
    }
  }

  static async set(key, value) {
    try {
      const query = 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?';
      const [result] = await db.execute(query, [key, value, value]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error in SettingModel.set for key ${key}:`, error.message);
      throw error;
    }
  }

  static async getAll() {
    try {
      const query = 'SELECT * FROM settings';
      const [rows] = await db.execute(query);
      const settingsMap = {};
      rows.forEach((row) => {
        settingsMap[row.key] = row.value;
      });
      return settingsMap;
    } catch (error) {
      console.error('Error in SettingModel.getAll:', error.message);
      throw error;
    }
  }
}

module.exports = SettingModel;
