import express from 'express';
import materialCategoryController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

class MaterialCategoryRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // --- SPECIFIC ROUTES (MUST BE AT THE TOP) ---
    // These must be defined BEFORE /:id so they are not intercepted.

    // Create Page
    this.router.get(
      '/create',
      authMiddleware.canAccess('material-category', 'create'),
      materialCategoryController.create
    );

    // Store New Category
    this.router.post(
      '/',
      authMiddleware.canAccess('material-category', 'create'),
      materialCategoryController.store
    );

    // --- DYNAMIC ROUTES (/:id) ---
    // These act as catch-alls for IDs and must be at the BOTTOM.

    // List All
    this.router.get('/', materialCategoryController.index);

    // Edit Page
    this.router.get(
      '/:id/edit',
      authMiddleware.canAccess('material-category', 'update'),
      materialCategoryController.edit
    );

    // Update
    this.router.post(
      '/:id',
      authMiddleware.canAccess('material-category', 'update'),
      materialCategoryController.update
    );

    // Delete
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('material-category', 'delete'),
      materialCategoryController.destroy
    );

    // Show Detail (The wildcard that caused the error - MUST BE LAST)
    this.router.get('/:id', materialCategoryController.show);
  }

  getRouter() {
    return this.router;
  }
}

export default new MaterialCategoryRouter().getRouter();
