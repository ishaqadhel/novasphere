import express from 'express';
import authMiddleware from '../middlewares/index.js';
import homeRouter from '../modules/home/router.js';
import authRouter from '../modules/auth/router.js';
import dashboardRouter from '../modules/app/dashboard/router.js';
import materialCategoryRouter from '../modules/app/material-category/router.js';
import materialRouter from '../modules/app/material/router.js';
import userRouter from '../modules/app/user/router.js';
import projectTaskRouter from '../modules/app/project-task/router.js';
// 1. Import router Project
import projectRouter from '../modules/app/project/router.js';

// Additional routers
import supplierRouter from '../modules/supplier/routes.js';
import pricingRouter from '../modules/home/pricing/routes.js';
import reportRouter from '../modules/app/report/routes.js';

class MainRouter {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Public routes
    this.router.use('/', homeRouter);
    this.router.use('/auth', authRouter);
    this.router.use('/pricing', pricingRouter);

    // Protected routes (require authentication)
    this.router.use('/app/dashboard', authMiddleware.isAuthenticated, dashboardRouter);

    this.router.use(
      '/app/material-category',
      authMiddleware.isAuthenticated,
      materialCategoryRouter
    );

    this.router.use('/app/material', authMiddleware.isAuthenticated, materialRouter);
    this.router.use('/app/user', authMiddleware.isAuthenticated, userRouter);

    this.router.use('/app/project', authMiddleware.isAuthenticated, projectRouter);
    this.router.use('/app/project-task', authMiddleware.isAuthenticated, projectTaskRouter);
    this.router.use('/app/supplier', authMiddleware.isAuthenticated, supplierRouter);
    this.router.use('/app/report', authMiddleware.isAuthenticated, reportRouter);
  }

  getRouter() {
    return this.router;
  }
}

export default new MainRouter().getRouter();
