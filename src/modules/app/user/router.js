import express from 'express';
import userController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

class UserRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // --- SPECIFIC ROUTES ---
    // Specific routes must be defined BEFORE dynamic routes (like /:id)
    // otherwise the dynamic route will catch "create" as an ID.

    // Create Page
    this.router.get('/create', authMiddleware.canAccess('user', 'create'), userController.create);

    // Store User
    this.router.post('/', authMiddleware.canAccess('user', 'create'), userController.store);

    // --- DYNAMIC ROUTES (/:id) ---
    // These must be at the bottom so they don't intercept specific paths.

    // List all users
    this.router.get('/', userController.index);

    // Edit Page
    this.router.get(
      '/:id(\\d+)/edit',
      authMiddleware.canAccess('user', 'update'),
      userController.edit
    );

    // Update User
    this.router.post(
      '/:id(\\d+)',
      authMiddleware.canAccess('user', 'update'),
      userController.update
    );

    // Delete User
    this.router.post(
      '/:id(\\d+)/delete',
      authMiddleware.canAccess('user', 'delete'),
      userController.destroy
    );

    // View User Details (Catch-all for IDs)
    this.router.get('/:id(\\d+)', userController.show);
  }

  getRouter() {
    return this.router;
  }
}

export default new UserRouter().getRouter();
