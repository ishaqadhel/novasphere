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
    // Read operations (PM and Supervisor)
    this.router.get('/', projectController.index);
    this.router.get('/:id', projectController.show); // View Dashboard

    // Write operations (PM only)
    this.router.get(
      '/create',
      authMiddleware.canAccess('project', 'create'),
      projectController.create
    );
    this.router.post('/', authMiddleware.canAccess('project', 'create'), projectController.store);
    this.router.get(
      '/:id/edit',
      authMiddleware.canAccess('project', 'update'),
      projectController.edit
    );
    this.router.post(
      '/:id',
      authMiddleware.canAccess('project', 'update'),
      projectController.update
    );
    this.router.post(
      '/:id/delete',
      authMiddleware.canAccess('project', 'delete'),
      projectController.destroy
    );

    // Nested router for project material requirements
    this.router.use('/:projectId/materials', projectMaterialRequirementRouter);
  }

  getRouter() {
    return this.router;
  }
}

export default new ProjectRouter().getRouter();
