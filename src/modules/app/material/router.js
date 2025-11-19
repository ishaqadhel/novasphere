import express from 'express';
import materialController from './controller.js';

class MaterialRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', materialController.index);
    this.router.get('/create', materialController.create);
    this.router.post('/', materialController.store);
    this.router.get('/:id', materialController.show);
    this.router.get('/:id/edit', materialController.edit);
    this.router.post('/:id', materialController.update);
    this.router.post('/:id/delete', materialController.destroy);
  }

  getRouter() {
    return this.router;
  }
}

export default new MaterialRouter().getRouter();
