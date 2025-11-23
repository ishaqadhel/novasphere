import BaseService from '../../services/index.js';

class HomeService extends BaseService {
  async getHomeData() {
    return {
      appName: 'Novasphere',
      description: 'Construction Supplier Management System',
    };
  }
}

export default new HomeService();
