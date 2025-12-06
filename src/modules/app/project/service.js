import BaseService from '../../../services/index.js';
import projectRepository from '../../../repositories/project/index.js';
import notificationService from '../../../services/notification/index.js';
import userRepository from '../../../repositories/user/index.js';

class ProjectService extends BaseService {
  async getAllProjects() {
    try {
      return await projectRepository.getAll();
    } catch (error) {
      throw this.handleError(error, 'Failed to get projects');
    }
  }

  async searchProjects(keyword) {
    try {
      return await projectRepository.search(keyword);
    } catch (error) {
      throw this.handleError(error, 'Failed to search projects');
    }
  }

  async getProjectById(id) {
    try {
      const project = await projectRepository.getOneById(id);
      if (!project) throw new Error('Project not found');
      return project;
    } catch (error) {
      throw this.handleError(error, 'Failed to get project');
    }
  }

  async createProject(data, userId) {
    try {
      this.validateRequired(data, [
        'name',
        'project_manager',
        'budget',
        'status',
        'start_date',
        'end_date',
      ]);

      const enrichedData = { ...data, created_by: userId };
      const projectId = await projectRepository.createOne(enrichedData);

      // Create notification
      const user = await userRepository.getOneById(userId);
      if (user) {
        await notificationService.notifyOnCRUD(
          'created',
          'Project',
          data.name,
          userId,
          `${user.first_name} ${user.last_name}`
        );
      }

      return projectId;
    } catch (error) {
      throw this.handleError(error, 'Failed to create project');
    }
  }

  async updateProject(id, data, userId) {
    try {
      this.validateRequired(data, [
        'name',
        'project_manager',
        'budget',
        'status',
        'start_date',
        'end_date',
      ]);

      const existing = await this.getProjectById(id);
      const enrichedData = { ...data, updated_by: userId };
      const result = await projectRepository.updateOneById(id, enrichedData);

      // Create notification
      const user = await userRepository.getOneById(userId);
      if (user) {
        await notificationService.notifyOnCRUD(
          'updated',
          'Project',
          data.name || existing.name,
          userId,
          `${user.first_name} ${user.last_name}`
        );
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to update project');
    }
  }

  async deleteProject(id, userId) {
    try {
      const existing = await this.getProjectById(id);
      const result = await projectRepository.deleteOneById(id, userId);

      // Create notification
      const user = await userRepository.getOneById(userId);
      if (user) {
        await notificationService.notifyOnCRUD(
          'deleted',
          'Project',
          existing.name,
          userId,
          `${user.first_name} ${user.last_name}`
        );
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete project');
    }
  }
}

export default new ProjectService();
