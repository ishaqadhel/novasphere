import databaseService from '../../services/database/index.js';

class ProjectMemberRepository {
  constructor() {
    this.tableName = 'project_members';
  }

  async getAll() {
    const query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL ORDER BY project_member_id ASC`;
    return await databaseService.query(query);
  }

  async getAllByProjectId(projectId) {
    const query = `
      SELECT pm.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email, r.name as role_name
      FROM ${this.tableName} pm
      LEFT JOIN users u ON pm.user_id = u.user_id
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE pm.project_id = ? AND pm.deleted_at IS NULL
      ORDER BY pm.project_member_id ASC
    `;
    return await databaseService.query(query, [projectId]);
  }

  async getOneById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE project_member_id = ? AND deleted_at IS NULL`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `INSERT INTO ${this.tableName} (project_id, user_id, is_active, created_by) VALUES (?, ?, ?, ?)`;
    const result = await databaseService.execute(query, [
      data.project_id,
      data.user_id,
      data.is_active ?? true,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `UPDATE ${this.tableName} SET is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE project_member_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [data.is_active ?? true, userId, id]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE project_member_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new ProjectMemberRepository();
