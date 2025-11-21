import express from 'express';
import projectController from './controller.js';

class ProjectRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', projectController.index);
    this.router.get('/create', projectController.create);
    this.router.post('/', projectController.store);
    this.router.get('/:id', projectController.show); // View Dashboard
    this.router.get('/:id/edit', projectController.edit);
    this.router.post('/:id', projectController.update);
    this.router.post('/:id/delete', projectController.destroy);
  }

  getRouter() {
    return this.router;
  }
}

export default new ProjectRouter().getRouter();
