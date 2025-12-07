import express from 'express';
import materialController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

class MaterialRouter {
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
      authMiddleware.canAccess('material', 'create'),
      materialController.create
    );

    // Store New Material
    this.router.post('/', authMiddleware.canAccess('material', 'create'), materialController.store);

    // --- DYNAMIC ROUTES (/:id) ---
    // These act as catch-alls for IDs and must be at the BOTTOM.

    // List All
    this.router.get('/', materialController.index);

    // Edit Page
    this.router.get(
      '/:id/edit',
      authMiddleware.canAccess('material', 'update'),
      materialController.edit
    );

    // Update
    this.router.post(
      '/:id',
      authMiddleware.canAccess('material', 'update'),
      materialController.update
    );

    // Delete
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('material', 'delete'),
      materialController.destroy
    );

    // Show Detail (The wildcard that caused the error - MUST BE LAST)
    this.router.get('/:id', materialController.show);
  }

  getRouter() {
    return this.router;
  }
}

export default new MaterialRouter().getRouter();
