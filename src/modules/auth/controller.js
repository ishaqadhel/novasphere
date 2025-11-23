import BaseController from '../../controllers/index.js';
import authService from './service.js';

class AuthController extends BaseController {
  constructor() {
    super();
    this.showLoginForm = this.showLoginForm.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
  }

  async showLoginForm(req, res) {
    try {
      return res.render('auth/login/index', {
        title: 'Login',
        error: null,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load login page', 500, error);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await authService.login(email, password);

      req.session.user = user;

      return this.redirect(res, '/app/dashboard');
    } catch (error) {
      return res.render('auth/login/index', {
        title: 'Login',
        error: error.message,
        email: req.body.email || '',
      });
    }
  }

  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        return this.redirect(res, '/auth/login');
      });
    } catch (error) {
      return this.sendError(res, 'Logout failed', 500, error);
    }
  }
}

export default new AuthController();
