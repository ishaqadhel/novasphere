import BaseService from '../../services/index.js';

class HomeService extends BaseService {
  async getHomeData() {
    try {
      return {
        appName: 'Novasphere',
        description: 'Construction Supplier Management System',
      };
    } catch (error) {
      this.handleError(error, 'Failed to get home data');
    }
  }
}

export default new HomeService();
