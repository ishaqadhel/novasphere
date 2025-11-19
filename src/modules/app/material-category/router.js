import express from 'express';
import materialCategoryController from './controller.js';

class MaterialCategoryRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', materialCategoryController.index);
    this.router.get('/create', materialCategoryController.create);
    this.router.post('/', materialCategoryController.store);
    this.router.get('/:id', materialCategoryController.show);
    this.router.get('/:id/edit', materialCategoryController.edit);
    this.router.post('/:id', materialCategoryController.update);
    this.router.post('/:id/delete', materialCategoryController.destroy);
  }

  getRouter() {
    return this.router;
  }
}

export default new MaterialCategoryRouter().getRouter();
