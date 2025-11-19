import BaseController from '../../../controllers/index.js';
import userService from '../user/service.js';
import materialService from '../material/service.js';
import supplierRepository from '../../../repositories/supplier/index.js';

class DashboardController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
  }

  async index(req, res) {
    try {
      // Fetch real counts from database in parallel
      const [userCount, materialCount, supplierCount] = await Promise.all([
        userService.countUsers(),
        materialService.countMaterials(),
        supplierRepository.count(),
      ]);

      const stats = {
        userCount,
        materialCount,
        supplierCount,
      };

      return this.renderView(res, 'app/dashboard/index', {
        title: 'Dashboard',
        stats,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load dashboard', 500, error);
    }
  }
}

export default new DashboardController();
