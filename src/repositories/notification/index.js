import databaseService from '../../services/database/index.js';

class NotificationRepository {
  constructor() {
    this.tableName = 'notifications';
  }

  async getAll() {
    const query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL ORDER BY notification_id DESC`;
    return await databaseService.query(query);
  }

  async getAllByUserId(userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND deleted_at IS NULL ORDER BY notification_id DESC`;
    return await databaseService.query(query, [userId]);
  }

  async getUnreadByUserId(userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND is_read = ? AND deleted_at IS NULL ORDER BY notification_id DESC`;
    return await databaseService.query(query, [userId, false]);
  }

  async getOneById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE notification_id = ? AND deleted_at IS NULL`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data) {
    const query = `INSERT INTO ${this.tableName} (title, message, notification_type, user_id, module_id, is_active) VALUES (?, ?, ?, ?, ?, ?)`;
    const result = await databaseService.execute(query, [
      data.title,
      data.message,
      data.notification_type,
      data.user_id,
      data.module_id || null,
      data.is_active ?? true,
    ]);
    return result.insertId;
  }

  async markAsRead(id) {
    const query = `UPDATE ${this.tableName} SET is_read = ?, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE notification_id = ?`;
    const result = await databaseService.execute(query, [true, id]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE notification_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new NotificationRepository();
