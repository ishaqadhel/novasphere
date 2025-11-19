import express from 'express';
import authController from './controller.js';
import authMiddleware from '../../middlewares/index.js';

class AuthRouter {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/login', authMiddleware.redirectIfAuthenticated, authController.showLoginForm);
    this.router.post('/login', authMiddleware.redirectIfAuthenticated, authController.login);
    this.router.get('/logout', authController.logout);
    this.router.post('/logout', authController.logout);
  }

  getRouter() {
    return this.router;
  }
}

export default new AuthRouter().getRouter();
