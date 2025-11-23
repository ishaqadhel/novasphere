// src/modules/home/pricing/controller.js

import BaseController from '../../../controllers/index.js';

class PricingController extends BaseController {
  async index(req, res) {
    return this.renderView(res, 'home/pricing', {
      title: 'Pricing Plans',
      user: this.getSessionUser(req),
    });
  }
}
export default new PricingController();
