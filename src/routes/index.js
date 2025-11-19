import express from 'express';
import authMiddleware from '../middlewares/index.js';
import homeRouter from '../modules/home/router.js';
import authRouter from '../modules/auth/router.js';
import supplierRouter from '../modules/app/supplier/router.js';
import materialCategoryRouter from '../modules/app/material-category/router.js';
import materialRouter from '../modules/app/material/router.js';

class MainRouter {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Public routes
    this.router.use('/', homeRouter);
    this.router.use('/auth', authRouter);

    // Protected routes (require authentication)
    this.router.use('/app/supplier', authMiddleware.isAuthenticated, supplierRouter);
    this.router.use('/app/material-category', authMiddleware.isAuthenticated, materialCategoryRouter);
    this.router.use('/app/material', authMiddleware.isAuthenticated, materialRouter);
  }

  getRouter() {
    return this.router;
  }
}

export default new MainRouter().getRouter();
