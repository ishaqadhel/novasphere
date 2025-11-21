import BaseService from '../../../services/index.js';
import projectRepository from '../../../repositories/project/index.js';

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
      return await projectRepository.createOne(enrichedData);
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

      await this.getProjectById(id);
      const enrichedData = { ...data, updated_by: userId };
      return await projectRepository.updateOneById(id, enrichedData);
    } catch (error) {
      throw this.handleError(error, 'Failed to update project');
    }
  }

  async deleteProject(id, userId) {
    try {
      await this.getProjectById(id);
      return await projectRepository.deleteOneById(id, userId);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete project');
    }
  }
}

export default new ProjectService();
