import express from 'express';
import userController from './controller.js';

class UserRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', userController.index);
    this.router.get('/create', userController.create);
    this.router.post('/', userController.store);
    this.router.get('/:id', userController.show);
    this.router.get('/:id/edit', userController.edit);
    this.router.post('/:id', userController.update);
    this.router.post('/:id/delete', userController.destroy);
  }

  getRouter() {
    return this.router;
  }
}

export default new UserRouter().getRouter();
