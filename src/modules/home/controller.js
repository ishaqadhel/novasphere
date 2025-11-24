import BaseController from '../../controllers/index.js';
import homeService from './service.js';

class HomeController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
  }

  async index(req, res) {
    try {
      const data = await homeService.getHomeData();

      return this.renderView(res, 'home/index', {
        title: 'Home',
        ...data,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load home page', 500, error);
    }
  }
}

export default new HomeController();
