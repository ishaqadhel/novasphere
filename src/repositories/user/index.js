import databaseService from '../../services/database/index.js';

class UserRepository {
  constructor() {
    this.tableName = 'users';
  }

  async getAll() {
    const query = `
      SELECT u.*, r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.deleted_at IS NULL
      ORDER BY u.user_id ASC
    `;
    return await databaseService.query(query);
  }

  async getAllActive() {
    const query = `
      SELECT u.*, r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.deleted_at IS NULL AND u.is_active = ?
      ORDER BY u.user_id ASC
    `;
    return await databaseService.query(query, [true]);
  }

  async getOneById(id) {
    const query = `
      SELECT u.*, r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.deleted_at IS NULL
    `;
    const rows = await databaseService.query(query, [id]);
    return rows[0] || null;
  }

  async getOneByEmail(email) {
    const query = `
      SELECT u.*, r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = ? AND u.deleted_at IS NULL
    `;
    const rows = await databaseService.query(query, [email]);
    return rows[0] || null;
  }

  async createOne(data) {
    const query = `
      INSERT INTO ${this.tableName}
      (email, password, first_name, last_name, phone, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseService.execute(query, [
      data.email,
      data.password,
      data.first_name,
      data.last_name,
      data.phone,
      data.role_id,
      data.is_active ?? true,
    ]);
    return result.insertId;
  }

  async updateOneById(id, data) {
    const fields = [];
    const values = [];

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.password !== undefined) {
      fields.push('password = ?');
      values.push(data.password);
    }
    if (data.first_name !== undefined) {
      fields.push('first_name = ?');
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      fields.push('last_name = ?');
      values.push(data.last_name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.role_id !== undefined) {
      fields.push('role_id = ?');
      values.push(data.role_id);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE user_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, values);
    return result.affectedRows > 0;
  }

  async updateLastLoginById(id) {
    const query = `UPDATE ${this.tableName} SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async deleteOneById(id) {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ? AND deleted_at IS NULL`;
    const result = await databaseService.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new UserRepository();
