import dotenv from 'dotenv';

dotenv.config();

class DatabaseConfig {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = parseInt(process.env.DB_PORT || '3306', 10);
    this.user = process.env.DB_USER || 'root';
    this.password = process.env.DB_PASSWORD || '';
    this.database = process.env.DB_NAME || 'novasphere_db';
    this.connectionLimit = 10;
    this.waitForConnections = true;
    this.queueLimit = 0;
  }

  getConfig() {
    return {
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: this.database,
      connectionLimit: this.connectionLimit,
      waitForConnections: this.waitForConnections,
      queueLimit: this.queueLimit,
      multipleStatements: true,
    };
  }
}

export default new DatabaseConfig();
