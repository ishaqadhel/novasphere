import databaseService from '../../services/database/index.js';

class ProjectTaskRepository {
  constructor() {
    this.tableName = 'project_tasks';
  }

  async getAll() {
    const query = `
      SELECT pt.*, pts.name as status_name,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
      FROM ${this.tableName} pt
      LEFT JOIN project_task_statuses pts ON pt.status = pts.project_task_status_id
      LEFT JOIN users u ON pt.assigned_to = u.user_id
      WHERE pt.deleted_at IS NULL
      ORDER BY pt.project_task_id DESC
    `;
    return await databaseService.query(query);
  }

  async getOneById(id) {
    const query = `
      SELECT pt.*, pts.name as status_name,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
      FROM ${this.tableName} pt
      LEFT JOIN project_task_statuses pts ON pt.status = pts.project_task_status_id
      LEFT JOIN users u ON pt.assigned_to = u.user_id
      WHERE pt.project_task_id = ? AND pt.deleted_at IS NULL
    `;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `
      INSERT INTO ${this.tableName}
      (name, description, start_date, end_date, status, assigned_to, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description || null,
      data.start_date,
      data.end_date,
      data.status,
      data.assigned_to,
      data.is_active ?? true,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `
      UPDATE ${this.tableName}
      SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, assigned_to = ?,
          is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_task_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description || null,
      data.start_date,
      data.end_date,
      data.status,
      data.assigned_to,
      data.is_active ?? true,
      userId,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE project_task_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new ProjectTaskRepository();
