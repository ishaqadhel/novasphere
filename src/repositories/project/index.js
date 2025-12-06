import databaseService from '../../services/database/index.js';

class ProjectRepository {
  constructor() {
    this.tableName = 'projects';
  }

  _getBaseQuery() {
    return `
      SELECT p.*, 
             CONCAT(u.first_name, ' ', u.last_name) as manager_name,
             ps.name as status_name, 
             ps.project_status_id as status_id_ref
      FROM ${this.tableName} p
      LEFT JOIN users u ON p.project_manager = u.user_id
      LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
      WHERE p.deleted_at IS NULL
    `;
  }

  async getAll() {
    const query = `${this._getBaseQuery()} ORDER BY p.project_id DESC`;
    return await databaseService.query(query);
  }

  async search(keyword) {
    const query = `
      ${this._getBaseQuery()} 
      AND (p.name LIKE ? OR p.description LIKE ? OR ps.name LIKE ?)
      ORDER BY p.project_id DESC
    `;
    const searchTerm = `%${keyword}%`;
    return await databaseService.query(query, [searchTerm, searchTerm, searchTerm]);
  }

  async getOneById(id) {
    const query = `${this._getBaseQuery()} AND p.project_id = ?`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async getById(id) {
    return await this.getOneById(id);
  }

  async createOne(data) {
    const query = `
      INSERT INTO ${this.tableName} 
      (name, description, budget, start_date, end_date, actual_end_date, is_active, project_manager, status, created_by, updated_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description,
      data.budget,
      data.start_date,
      data.end_date,
      data.actual_end_date,
      data.is_active,
      data.project_manager,
      data.status,
      data.created_by,
      data.created_by,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data) {
    const query = `
      UPDATE ${this.tableName} 
      SET name = ?, description = ?, budget = ?, 
          start_date = ?, end_date = ?, actual_end_date = ?, 
          is_active = ?, project_manager = ?, status = ?, updated_by = ?
      WHERE project_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.description,
      data.budget,
      data.start_date,
      data.end_date,
      data.actual_end_date,
      data.is_active,
      data.project_manager,
      data.status,
      data.updated_by,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id, userId) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE project_id = ?`;
    const result = await databaseService.execute(query, [userId, id]);
    return result.affectedRows > 0;
  }

  async count() {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE deleted_at IS NULL`;
    const result = await databaseService.query(query);
    return result[0].count;
  }
}

export default new ProjectRepository();
