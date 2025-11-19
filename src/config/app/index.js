import dotenv from 'dotenv';

dotenv.config();

class AppConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.port = process.env.PORT || 3000;
    this.appName = process.env.APP_NAME || 'Novasphere';
    this.sessionSecret = process.env.SESSION_SECRET || 'default-secret-key';
    this.sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000', 10);
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production';
  }

  getConfig() {
    return {
      env: this.env,
      port: this.port,
      appName: this.appName,
      sessionSecret: this.sessionSecret,
      sessionMaxAge: this.sessionMaxAge,
    };
  }
}

export default new AppConfig();
