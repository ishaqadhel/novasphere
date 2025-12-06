import express from 'express';
import materialCategoryController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

class MaterialCategoryRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Read operations (all authenticated users can access)
    this.router.get('/', materialCategoryController.index);
    this.router.get('/:id', materialCategoryController.show);

    // Write operations (admin only)
    this.router.get(
      '/create',
      authMiddleware.canAccess('material-category', 'create'),
      materialCategoryController.create
    );
    this.router.post(
      '/',
      authMiddleware.canAccess('material-category', 'create'),
      materialCategoryController.store
    );
    this.router.get(
      '/:id/edit',
      authMiddleware.canAccess('material-category', 'update'),
      materialCategoryController.edit
    );
    this.router.post(
      '/:id',
      authMiddleware.canAccess('material-category', 'update'),
      materialCategoryController.update
    );
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('material-category', 'delete'),
      materialCategoryController.destroy
    );
  }

  getRouter() {
    return this.router;
  }
}

export default new MaterialCategoryRouter().getRouter();
