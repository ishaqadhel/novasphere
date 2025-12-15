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
        pmrs.name as status_name,
        pmru.name as unit_name,
        sr.supplier_rating_id,
        sr.rating as supplier_rating
      FROM ${this.tableName} pmr
      LEFT JOIN projects p ON pmr.project_id = p.project_id
      LEFT JOIN materials m ON pmr.material_id = m.material_id
      LEFT JOIN suppliers s ON pmr.supplier_id = s.supplier_id
      LEFT JOIN project_material_requirement_statuses pmrs ON pmr.status = pmrs.project_material_requirement_status_id
      LEFT JOIN project_material_requirement_units pmru ON pmr.unit_id = pmru.unit_id
      LEFT JOIN supplier_ratings sr ON pmr.project_material_requirement_id = sr.project_material_requirement_id AND sr.deleted_at IS NULL
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
      (project_id, material_id, supplier_id, quantity, unit_id, price, total_price, arrived_date, status, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.project_id,
      data.material_id,
      data.supplier_id,
      data.quantity,
      data.unit_id || null,
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
      SET material_id = ?, supplier_id = ?, quantity = ?, unit_id = ?, price = ?, total_price = ?,
          arrived_date = ?, actual_arrived_date = ?, good_quantity = ?, bad_quantity = ?,
          status = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_material_requirement_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.material_id,
      data.supplier_id,
      data.quantity,
      data.unit_id || null,
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

  /**
   * Get PMRs that are at risk of delay
   * Finds materials scheduled to arrive within X days but not yet delivered
   * This indicates a potential delay risk that needs immediate attention
   * @param {number} daysThreshold - Number of days to look ahead (e.g., 3)
   * @returns {Promise<Array>} PMRs at risk of delay
   */
  async getPendingArrivalsWithinDays(daysThreshold) {
    const query = `
      SELECT pmr.*,
        p.name as project_name,
        m.name as material_name,
        s.name as supplier_name,
        pmrs.name as status_name,
        pmru.name as unit_name,
        u.user_id as creator_id,
        u.email as creator_email,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name
      FROM ${this.tableName} pmr
      LEFT JOIN projects p ON pmr.project_id = p.project_id
      LEFT JOIN materials m ON pmr.material_id = m.material_id
      LEFT JOIN suppliers s ON pmr.supplier_id = s.supplier_id
      LEFT JOIN project_material_requirement_statuses pmrs
        ON pmr.status = pmrs.project_material_requirement_status_id
      LEFT JOIN project_material_requirement_units pmru ON pmr.unit_id = pmru.unit_id
      LEFT JOIN users u ON pmr.created_by = u.user_id
      WHERE pmr.deleted_at IS NULL
        AND pmr.status != 4
        AND pmr.arrived_date IS NOT NULL
        AND pmr.arrived_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND pmr.arrived_date >= CURDATE()
        AND u.is_active = 1
      ORDER BY pmr.arrived_date ASC
    `;
    return await databaseService.query(query, [daysThreshold]);
  }
}

export default new ProjectMaterialRequirementRepository();
