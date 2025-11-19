import mysql from 'mysql2/promise';
import databaseConfig from '../../config/database/index.js';

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool(databaseConfig.getConfig());
      console.log('Database connection pool created successfully');
      return this.pool;
    } catch (error) {
      console.error('Failed to create database connection pool:', error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }
      const [rows] = await this.pool.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  }

  async execute(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }
      const [result] = await this.pool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('Database execute error:', error.message);
      throw error;
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection pool closed');
    }
  }
}

export default new DatabaseService();
