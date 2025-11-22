import BaseService from '../../../services/index.js';
import projectTaskRepository from '../../../repositories/project-task/index.js';

class ProjectTaskService extends BaseService {
  async getTasksByProject(projectId) {
    try {
      return await projectTaskRepository.getAllByProjectId(projectId);
    } catch (error) {
      throw this.handleError(error, 'Failed to get tasks');
    }
  }

  async searchTasks(projectId, keyword) {
    try {
      return await projectTaskRepository.search(projectId, keyword);
    } catch (error) {
      throw this.handleError(error, 'Failed to search tasks');
    }
  }

  async getTaskById(id) {
    try {
      const task = await projectTaskRepository.getOneById(id);
      if (!task) throw new Error('Task not found');
      return task;
    } catch (error) {
      throw this.handleError(error, 'Failed to get task');
    }
  }

  async createTask(data, userId) {
    try {
      this.validateRequired(data, [
        'project_id',
        'name',
        'project_task_status_id',
        'start_date',
        'end_date',
      ]);

      const enrichedData = { ...data, created_by: userId };
      return await projectTaskRepository.createOne(enrichedData);
    } catch (error) {
      throw this.handleError(error, 'Failed to create task');
    }
  }

  async updateTask(id, data, userId) {
    try {
      this.validateRequired(data, ['name', 'project_task_status_id', 'start_date', 'end_date']);

      await this.getTaskById(id);
      const enrichedData = { ...data, updated_by: userId };
      return await projectTaskRepository.updateOneById(id, enrichedData);
    } catch (error) {
      throw this.handleError(error, 'Failed to update task');
    }
  }

  async deleteTask(id, userId) {
    try {
      await this.getTaskById(id);
      return await projectTaskRepository.deleteOneById(id, userId);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete task');
    }
  }
}

export default new ProjectTaskService();
