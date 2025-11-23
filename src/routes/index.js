import express from 'express';
import authMiddleware from '../middlewares/index.js';
import homeRouter from '../modules/home/router.js';
import authRouter from '../modules/auth/router.js';
import dashboardRouter from '../modules/app/dashboard/router.js';
import materialCategoryRouter from '../modules/app/material-category/router.js';
import materialRouter from '../modules/app/material/router.js';
import userRouter from '../modules/app/user/router.js';
import projectRouter from '../modules/app/project/router.js';

// [整合區塊] 王紹帆新增的路由模組
import supplierRouter from '../modules/supplier/routes.js';
import projectMaterialRouter from '../modules/app/project-material-requirement/routes.js';
import pricingRouter from '../modules/home/pricing/routes.js';
import reportRouter from '../modules/app/report/routes.js';

class MainRouter {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // ----------------------------------------------------
    // Public routes (公開路由)
    // ----------------------------------------------------
    this.router.use('/', homeRouter);
    this.router.use('/auth', authRouter);

    // [修正] 新增 Pricing 路由 (必須放在 Public 區塊)
    this.router.use('/pricing', pricingRouter);

    // ----------------------------------------------------
    // Protected routes (需登入路由)
    // ----------------------------------------------------

    this.router.use('/app/dashboard', authMiddleware.isAuthenticated, dashboardRouter);
    this.router.use(
      '/app/material-category',
      authMiddleware.isAuthenticated,
      materialCategoryRouter
    );
    this.router.use('/app/material', authMiddleware.isAuthenticated, materialRouter);
    this.router.use('/app/user', authMiddleware.isAuthenticated, userRouter);

    this.router.use('/app/project', authMiddleware.isAuthenticated, projectRouter);

    // [王紹帆的 Protected 路由]
    this.router.use('/app/supplier', authMiddleware.isAuthenticated, supplierRouter);
    this.router.use('/app/project-material', authMiddleware.isAuthenticated, projectMaterialRouter);
    this.router.use('/app/report', authMiddleware.isAuthenticated, reportRouter);
  }

  getRouter() {
    return this.router;
  }
}

export default new MainRouter().getRouter();
