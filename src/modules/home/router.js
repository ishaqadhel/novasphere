import express from 'express';
import homeController from './controller.js';

class HomeRouter {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/', homeController.index);
  }

  getRouter() {
    return this.router;
  }
}

export default new HomeRouter().getRouter();
