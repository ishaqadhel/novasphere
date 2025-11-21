import BaseService from '../../../services/index.js';
import projectStatusRepository from '../../../repositories/project-status/index.js';

class ProjectStatusService extends BaseService {
  async getAllActiveStatuses() {
    try {
      return await projectStatusRepository.getAllActive();
    } catch (error) {
      throw this.handleError(error, 'Failed to get project statuses');
    }
  }
}

export default new ProjectStatusService();
