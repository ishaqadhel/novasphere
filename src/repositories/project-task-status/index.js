import databaseService from '../../services/database/index.js';

class ProjectTaskStatusRepository {
  constructor() {
    this.tableName = 'project_task_statuses';
  }

  async getAll() {
    const query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL ORDER BY project_task_status_id ASC`;
    return await databaseService.query(query);
  }

  async getAllActive() {
    const query = `
      SELECT project_task_status_id, name 
      FROM ${this.tableName} 
      WHERE is_active = 1 AND deleted_at IS NULL
      ORDER BY project_task_status_id ASC
    `;
    return await databaseService.query(query);
  }

  async getOneById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE project_task_status_id = ? AND deleted_at IS NULL`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data) {
    const query = `INSERT INTO ${this.tableName} (name, is_active) VALUES (?, ?)`;
    const result = await databaseService.execute(query, [data.name, data.is_active ?? true]);
    return result.insertId;
  }

  async updateOneById(id, data) {
    const query = `UPDATE ${this.tableName} SET name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE project_task_status_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [data.name, data.is_active ?? true, id]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE project_task_status_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new ProjectTaskStatusRepository();
