import express from 'express';
import dashboardController from './controller.js';

class DashboardRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', dashboardController.index);
  }

  getRouter() {
    return this.router;
  }
}

export default new DashboardRouter().getRouter();
