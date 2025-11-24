import BaseController from '../../../controllers/index.js';

class ReportController extends BaseController {
  async index(req, res) {
    try {
      return this.renderView(res, 'app/report/home', {
        title: 'Reports & Analytics',
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load reports', 500, error);
    }
  }
}
export default new ReportController();
