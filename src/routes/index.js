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
import supplierRouter from '../modules/app/supplier/router.js';
import pricingRouter from '../modules/home/pricing/routes.js';
import reportRouter from '../modules/app/report/routes.js';
import projectMaterialRequirementRouter from '../modules/app/project-material-requirement/router.js';
import notificationRouter from '../modules/app/notification/router.js';

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

    // Common routes (all authenticated users)
    this.router.use('/app/dashboard', authMiddleware.isAuthenticated, dashboardRouter);
    this.router.use('/app/notification', authMiddleware.isAuthenticated, notificationRouter);

    // All authenticated users can access (write protection at route level)
    this.router.use(
      '/app/material-category',
      authMiddleware.isAuthenticated,
      materialCategoryRouter
    );
    this.router.use('/app/material', authMiddleware.isAuthenticated, materialRouter);
    this.router.use('/app/user', authMiddleware.isAuthenticated, userRouter);
    this.router.use('/app/supplier', authMiddleware.isAuthenticated, supplierRouter);

    // PM and Supervisor routes (Admin cannot access)
    this.router.use(
      '/app/project',
      authMiddleware.isAuthenticated,
      authMiddleware.hasRole(['pm', 'supervisor']),
      projectRouter
    );

    // PM-only routes
    this.router.use(
      '/app/project-task',
      authMiddleware.isAuthenticated,
      authMiddleware.hasRole('pm'),
      projectTaskRouter
    );

    // PM and Supervisor routes
    this.router.use(
      '/app/project-material-requirement',
      authMiddleware.isAuthenticated,
      authMiddleware.hasRole(['pm', 'supervisor']),
      projectMaterialRequirementRouter
    );

    // Report (all roles)
    this.router.use('/app/report', authMiddleware.isAuthenticated, reportRouter);
  }

  getRouter() {
    return this.router;
  }
}

export default new MainRouter().getRouter();
