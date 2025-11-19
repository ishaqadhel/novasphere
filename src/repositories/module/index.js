import databaseService from '../../services/database/index.js';

class ModuleRepository {
  constructor() {
    this.tableName = 'modules';
  }

  async getAll() {
    const query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL ORDER BY module_id ASC`;
    return await databaseService.query(query);
  }

  async getAllActive() {
    const query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL AND is_active = ? ORDER BY module_id ASC`;
    return await databaseService.query(query, [true]);
  }

  async getOneById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE module_id = ? AND deleted_at IS NULL`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `INSERT INTO ${this.tableName} (name, description, is_active, created_by) VALUES (?, ?, ?, ?)`;
    const result = await databaseService.execute(query, [
      data.name,
      data.description || null,
      data.is_active ?? true,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `UPDATE ${this.tableName} SET name = ?, description = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE module_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [
      data.name,
      data.description || null,
      data.is_active ?? true,
      userId,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE module_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new ModuleRepository();
