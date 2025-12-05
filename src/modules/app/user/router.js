import express from 'express';
import userController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

class UserRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Read operations (all authenticated users can access)
    this.router.get('/', userController.index);
    this.router.get('/:id', userController.show);

    // Write operations (admin only)
    this.router.get('/create', authMiddleware.canAccess('user', 'create'), userController.create);
    this.router.post('/', authMiddleware.canAccess('user', 'create'), userController.store);
    this.router.get('/:id/edit', authMiddleware.canAccess('user', 'update'), userController.edit);
    this.router.post('/:id', authMiddleware.canAccess('user', 'update'), userController.update);
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('user', 'delete'),
      userController.destroy
    );
  }

  getRouter() {
    return this.router;
  }
}

export default new UserRouter().getRouter();
