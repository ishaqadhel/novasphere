import databaseService from '../../services/database/index.js';

class SupplierRatingRepository {
  constructor() {
    this.tableName = 'supplier_ratings';
  }

  async getAll() {
    const query = `
      SELECT sr.*, s.name as supplier_name
      FROM ${this.tableName} sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.supplier_id
      WHERE sr.deleted_at IS NULL
      ORDER BY sr.supplier_rating_id DESC
    `;
    return await databaseService.query(query);
  }

  async getAllBySupplierId(supplierId) {
    const query = `SELECT * FROM ${this.tableName} WHERE supplier_id = ? AND deleted_at IS NULL ORDER BY supplier_rating_id DESC`;
    return await databaseService.query(query, [supplierId]);
  }

  async getOneById(id) {
    const query = `
      SELECT sr.*, s.name as supplier_name
      FROM ${this.tableName} sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.supplier_id
      WHERE sr.supplier_rating_id = ? AND sr.deleted_at IS NULL
    `;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async createOne(data, userId) {
    const query = `
      INSERT INTO ${this.tableName}
      (supplier_id, project_material_requirement_id, rating, created_by)
      VALUES (?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.supplier_id,
      data.project_material_requirement_id,
      data.rating,
      userId,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data, userId) {
    const query = `
      UPDATE ${this.tableName}
      SET rating = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE supplier_rating_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.execute(query, [data.rating, userId, id]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE supplier_rating_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async getByProjectMaterialRequirementId(pmrId) {
    const query = `SELECT * FROM ${this.tableName} WHERE project_material_requirement_id = ? AND deleted_at IS NULL`;
    const rows = await databaseService.query(query, [pmrId]);
    return rows[0] || null;
  }

  async calculateAverageRatingForSupplier(supplierId) {
    const query = `
      SELECT AVG(rating) as average_rating
      FROM ${this.tableName}
      WHERE supplier_id = ? AND deleted_at IS NULL
    `;
    const result = await databaseService.query(query, [supplierId]);
    return result[0]?.average_rating || null;
  }
}

export default new SupplierRatingRepository();
