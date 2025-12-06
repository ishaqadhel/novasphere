import databaseService from '../../services/database/index.js';

class SupplierRepository {
  constructor() {
    this.tableName = 'suppliers';
  }

  async getAll() {
    const query = `
      SELECT s.*,
        CONCAT(cu.first_name, ' ', cu.last_name) as created_by_name
      FROM ${this.tableName} s
      LEFT JOIN users cu ON s.created_by = cu.user_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.supplier_id DESC
    `;
    return await databaseService.query(query);
  }

  async getOneById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE supplier_id = ? AND deleted_at IS NULL`;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `
      INSERT INTO ${this.tableName}
      (name, email, phone, address, website, rating, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.email,
      data.phone,
      data.address,
      data.website || null,
      data.rating || null,
      data.is_active ?? true,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `
      UPDATE ${this.tableName}
      SET name = ?, email = ?, phone = ?, address = ?, website = ?, rating = ?, is_active = ?,
          updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE supplier_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [
      data.name,
      data.email,
      data.phone,
      data.address,
      data.website || null,
      data.rating || null,
      data.is_active ?? true,
      userId,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE supplier_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async count() {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE deleted_at IS NULL`;
    const result = await databaseService.query(query);
    return result[0].count;
  }
  // ----------------------------------------------------
}

export default new SupplierRepository();
