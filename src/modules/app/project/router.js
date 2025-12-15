import express from 'express';
import projectController from './controller.js';
import projectMaterialRequirementRouter from '../project-material-requirement/router.js';
import authMiddleware from '../../../middlewares/index.js';

class ProjectRouter {
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
      authMiddleware.canAccess('project', 'create'),
      projectController.create
    );

    // Store New Project
    this.router.post('/', authMiddleware.canAccess('project', 'create'), projectController.store);

    // --- DYNAMIC ROUTES (/:id) ---
    // These act as catch-alls for IDs and must be at the BOTTOM.

    // List All
    this.router.get('/', projectController.index);

    // Edit Page
    this.router.get(
      '/:id/edit',
      authMiddleware.canAccess('project', 'update'),
      projectController.edit
    );

    // Update
    this.router.post(
      '/:id',
      authMiddleware.canAccess('project', 'update'),
      projectController.update
    );

    // Delete
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('project', 'delete'),
      projectController.destroy
    );

    // Show Dashboard (The wildcard that caused the error - MUST BE LAST)
    this.router.get('/:id', projectController.show);

    // Nested router for project material requirements
    // (Note: Since this also uses :projectId, keep it distinct or place carefully.
    // Here it's fine because it has a specific suffix /materials)
    this.router.use('/:projectId/materials', projectMaterialRequirementRouter);
  }

  getRouter() {
    return this.router;
  }
}

export default new ProjectRouter().getRouter();
