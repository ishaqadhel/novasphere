import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import appConfig from './config/app/index.js';
import databaseService from './services/database/index.js';
import mainRouter from './routes/index.js';
import authMiddleware from './middlewares/index.js';
import schedulerService from './services/scheduler/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Application {
  constructor() {
    this.app = express();
    this.port = appConfig.port;
  }

  async initialize() {
    try {
      await this.connectDatabase();
      this.setupMiddleware();
      this.setupViewEngine();
      this.setupRoutes();
      this.setupErrorHandlers();
      this.setupGracefulShutdown();
      this.start();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  async connectDatabase() {
    try {
      await databaseService.connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      session({
        secret: appConfig.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: appConfig.sessionMaxAge,
          httpOnly: true,
          secure: appConfig.isProduction(),
        },
      })
    );

    this.app.use(express.static(path.join(__dirname, 'public')));

    this.app.use(authMiddleware.attachUserToLocals);
  }

  setupViewEngine() {
    const viewsPath = path.join(__dirname, 'views');
    console.log('Views directory set to:', viewsPath);
    this.app.set('view engine', 'hjs');
    this.app.set('views', viewsPath);
  }

  setupRoutes() {
    this.app.use('/', mainRouter);
  }

  setupErrorHandlers() {
    this.app.use((req, res) => {
      res.status(404).render('errors/404');
    });

    this.app.use((err, req, res, _next) => {
      console.error('Error:', err);
      res.status(500).send('500 - Internal Server Error');
    });
  }

  setupGracefulShutdown() {
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await this.shutdown();
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await this.shutdown();
    });
  }

  async shutdown() {
    try {
      schedulerService.stop();
      await databaseService.close();
      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║         Novasphere Application         ║
╠════════════════════════════════════════╣
║  Environment: ${appConfig.env.padEnd(27)} ║
║  Port:        ${this.port.toString().padEnd(27)} ║
║  URL:         http://localhost:${this.port.toString().padEnd(12)} ║
╚════════════════════════════════════════╝
      `);

      // Start scheduler after server is listening
      schedulerService.start();
    });
  }
}

const app = new Application();
app.initialize();

export default app;
