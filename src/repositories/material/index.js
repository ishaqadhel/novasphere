import databaseService from '../../services/database/index.js';

class MaterialRepository {
  constructor() {
    this.tableName = 'materials';
  }

  async getAll() {
    const query = `
      SELECT m.*, mc.name as category_name
      FROM ${this.tableName} m
      LEFT JOIN material_categories mc ON m.material_category_id = mc.material_category_id
      WHERE m.deleted_at IS NULL
      ORDER BY m.material_id ASC
    `;
    return await databaseService.query(query);
  }

  async getAllActive() {
    const query = `
      SELECT m.*, mc.name as category_name
      FROM ${this.tableName} m
      LEFT JOIN material_categories mc ON m.material_category_id = mc.material_category_id
      WHERE m.deleted_at IS NULL AND m.is_active = ?
      ORDER BY m.material_id ASC
    `;
    return await databaseService.query(query, [true]);
  }

  async getOneById(id) {
    const query = `
      SELECT m.*, mc.name as category_name
      FROM ${this.tableName} m
      LEFT JOIN material_categories mc ON m.material_category_id = mc.material_category_id
      WHERE m.material_id = ? AND m.deleted_at IS NULL
    `;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data) {
    const query = `INSERT INTO ${this.tableName} (name, material_category_id, is_active) VALUES (?, ?, ?)`;
    const result = await databaseService.execute(query, [
      data.name,
      data.material_category_id,
      data.is_active ?? true,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data) {
    const query = `UPDATE ${this.tableName} SET name = ?, material_category_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE material_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [
      data.name,
      data.material_category_id,
      data.is_active ?? true,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE material_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new MaterialRepository();
