import express from 'express';
import materialController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

class MaterialRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Read operations (all authenticated users can access)
    this.router.get('/', materialController.index);
    this.router.get('/:id', materialController.show);

    // Write operations (admin only)
    this.router.get(
      '/create',
      authMiddleware.canAccess('material', 'create'),
      materialController.create
    );
    this.router.post('/', authMiddleware.canAccess('material', 'create'), materialController.store);
    this.router.get(
      '/:id/edit',
      authMiddleware.canAccess('material', 'update'),
      materialController.edit
    );
    this.router.post(
      '/:id',
      authMiddleware.canAccess('material', 'update'),
      materialController.update
    );
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('material', 'delete'),
      materialController.destroy
    );
  }

  getRouter() {
    return this.router;
  }
}

export default new MaterialRouter().getRouter();
