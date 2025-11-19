import databaseService from '../../services/database/index.js';

class ProjectRepository {
  constructor() {
    this.tableName = 'projects';
  }

  async getAll() {
    const query = `
      SELECT p.*, ps.name as status_name,
        CONCAT(pm.first_name, ' ', pm.last_name) as project_manager_name
      FROM ${this.tableName} p
      LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
      LEFT JOIN users pm ON p.project_manager = pm.user_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.project_id DESC
    `;
    return await databaseService.query(query);
  }

  async getOneById(id) {
    const query = `
      SELECT p.*, ps.name as status_name,
        CONCAT(pm.first_name, ' ', pm.last_name) as project_manager_name
      FROM ${this.tableName} p
      LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
      LEFT JOIN users pm ON p.project_manager = pm.user_id
      WHERE p.project_id = ? AND p.deleted_at IS NULL
    `;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `
      INSERT INTO ${this.tableName}
      (name, description, budget, start_date, end_date, status, project_manager, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description || null,
      data.budget,
      data.start_date,
      data.end_date,
      data.status,
      data.project_manager,
      data.is_active ?? true,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `
      UPDATE ${this.tableName}
      SET name = ?, description = ?, budget = ?, start_date = ?, end_date = ?, status = ?,
          project_manager = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description || null,
      data.budget,
      data.start_date,
      data.end_date,
      data.status,
      data.project_manager,
      data.is_active ?? true,
      userId,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new ProjectRepository();
