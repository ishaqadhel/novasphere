import databaseService from '../../services/database/index.js';

class ProjectTaskRepository {
  constructor() {
    this.tableName = 'project_tasks';
  }

  _getBaseQuery() {
    return `
      SELECT pt.*, 
             pts.name as status_name,
             CONCAT(u.first_name, ' ', u.last_name) as assignee_name,
             p.name as project_name
      FROM ${this.tableName} pt
      LEFT JOIN project_task_statuses pts ON pt.project_task_status_id = pts.project_task_status_id
      LEFT JOIN users u ON pt.assigned_to = u.user_id
      JOIN projects p ON pt.project_id = p.project_id
      WHERE pt.deleted_at IS NULL
    `;
  }

  async getAllByProjectId(projectId) {
    const query = `${this._getBaseQuery()} AND pt.project_id = ? ORDER BY pt.start_date ASC`;
    return await databaseService.query(query, [projectId]);
  }

  async search(projectId, keyword) {
    const query = `
      ${this._getBaseQuery()} 
      AND pt.project_id = ?
      AND (pt.name LIKE ? OR pt.description LIKE ? OR u.first_name LIKE ?)
      ORDER BY pt.start_date ASC
    `;
    const searchTerm = `%${keyword}%`;
    return await databaseService.query(query, [projectId, searchTerm, searchTerm, searchTerm]);
  }

  async getOneById(id) {
    const query = `${this._getBaseQuery()} AND pt.project_task_id = ?`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data) {
    const query = `
      INSERT INTO ${this.tableName} 
      (project_id, name, description, project_task_status_id, assigned_to, start_date, end_date, actual_end_date, is_active, created_by, updated_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.project_id,
      data.name,
      data.description,
      data.project_task_status_id,
      data.assigned_to || null,
      data.start_date,
      data.end_date,
      data.actual_end_date || null,
      data.is_active,
      data.created_by,
      data.created_by,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data) {
    const query = `
      UPDATE ${this.tableName} 
      SET name = ?, description = ?, project_task_status_id = ?, assigned_to = ?, 
          start_date = ?, end_date = ?, actual_end_date = ?, is_active = ?, updated_by = ?
      WHERE project_task_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description,
      data.project_task_status_id,
      data.assigned_to || null,
      data.start_date,
      data.end_date,
      data.actual_end_date || null,
      data.is_active,
      data.updated_by,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id, userId) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE project_task_id = ?`;
    const result = await databaseService.execute(query, [userId, id]);
    return result.affectedRows > 0;
  }
}

export default new ProjectTaskRepository();
