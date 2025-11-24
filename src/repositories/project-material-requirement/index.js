import databaseService from '../../services/database/index.js';

class ProjectMaterialRequirementRepository {
  constructor() {
    this.tableName = 'project_material_requirements';
  }

  _getBaseQuery() {
    return `
      SELECT pmr.*,
        p.name as project_name,
        m.name as material_name,
        s.name as supplier_name,
        pmrs.name as status_name
      FROM ${this.tableName} pmr
      LEFT JOIN projects p ON pmr.project_id = p.project_id
      LEFT JOIN materials m ON pmr.material_id = m.material_id
      LEFT JOIN suppliers s ON pmr.supplier_id = s.supplier_id
      LEFT JOIN project_material_requirement_statuses pmrs ON pmr.status = pmrs.project_material_requirement_status_id
      WHERE pmr.deleted_at IS NULL
    `;
  }

  async getAll() {
    const query = `${this._getBaseQuery()} ORDER BY pmr.project_material_requirement_id DESC`;
    return await databaseService.query(query);
  }

  async getByProjectId(projectId) {
    const query = `${this._getBaseQuery()} AND pmr.project_id = ? ORDER BY pmr.project_material_requirement_id DESC`;
    return await databaseService.query(query, [projectId]);
  }

  async getOneById(id) {
    const query = `${this._getBaseQuery()} AND pmr.project_material_requirement_id = ?`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `
      INSERT INTO ${this.tableName}
      (project_id, material_id, supplier_id, quantity, unit, price, total_price, arrived_date, status, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.project_id,
      data.material_id,
      data.supplier_id,
      data.quantity,
      data.unit || null,
      data.price,
      data.total_price,
      data.arrived_date,
      data.status,
      data.is_active ?? true,
      userId,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `
      UPDATE ${this.tableName}
      SET material_id = ?, supplier_id = ?, quantity = ?, unit = ?, price = ?, total_price = ?,
          arrived_date = ?, actual_arrived_date = ?, good_quantity = ?, bad_quantity = ?,
          status = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_material_requirement_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.material_id,
      data.supplier_id,
      data.quantity,
      data.unit || null,
      data.price,
      data.total_price,
      data.arrived_date,
      data.actual_arrived_date || null,
      data.good_quantity || 0,
      data.bad_quantity || 0,
      data.status,
      data.is_active ?? true,
      userId,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id, userId) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE project_material_requirement_id = ?`;
    const result = await databaseService.execute(query, [userId, id]);
    return result.affectedRows > 0;
  }
}

export default new ProjectMaterialRequirementRepository();
