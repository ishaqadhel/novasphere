import express from 'express';
import projectTaskController from './controller.js';

class ProjectTaskRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', projectTaskController.index);
    this.router.get('/create', projectTaskController.create);
    this.router.post('/', projectTaskController.store);

    this.router.get('/:id', projectTaskController.show);
    // -----------------------------

    this.router.get('/:id/edit', projectTaskController.edit);
    this.router.post('/:id', projectTaskController.update);
    this.router.post('/:id/delete', projectTaskController.destroy);
  }

  getRouter() {
    return this.router;
  }
}

export default new ProjectTaskRouter().getRouter();
