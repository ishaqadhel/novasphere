import BaseService from '../../../services/index.js';
import materialRepository from '../../../repositories/material/index.js';
import notificationService from '../../../services/notification/index.js';
import userRepository from '../../../repositories/user/index.js';

class MaterialService extends BaseService {
  constructor() {
    super();
  }

  async getAllMaterials() {
    try {
      return await materialRepository.getAll();
    } catch (error) {
      throw this.handleError(error, 'Failed to get materials');
    }
  }

  async getAllActiveMaterials() {
    try {
      return await materialRepository.getAllActive();
    } catch (error) {
      throw this.handleError(error, 'Failed to get active materials');
    }
  }

  async getMaterialById(id) {
    try {
      const material = await materialRepository.getOneById(id);

      if (!material) {
        throw new Error('Material not found');
      }

      return material;
    } catch (error) {
      throw this.handleError(error, 'Failed to get material');
    }
  }

  async createMaterial(data, userId) {
    try {
      this.validateRequired(data, ['name', 'material_category_id']);

      const materialId = await materialRepository.createOne(data);

      // Create notification
      if (userId) {
        const user = await userRepository.getOneById(userId);
        if (user) {
          await notificationService.notifyOnCRUD(
            'created',
            'Material',
            data.name,
            userId,
            `${user.first_name} ${user.last_name}`
          );
        }
      }

      return materialId;
    } catch (error) {
      throw this.handleError(error, 'Failed to create material');
    }
  }

  async updateMaterial(id, data, userId) {
    try {
      this.validateRequired(data, ['name', 'material_category_id']);

      const existing = await this.getMaterialById(id);

      const result = await materialRepository.updateOneById(id, data);

      if (!result) {
        throw new Error('Failed to update material');
      }

      // Create notification
      if (userId) {
        const user = await userRepository.getOneById(userId);
        if (user) {
          await notificationService.notifyOnCRUD(
            'updated',
            'Material',
            data.name || existing.name,
            userId,
            `${user.first_name} ${user.last_name}`
          );
        }
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to update material');
    }
  }

  async deleteMaterial(id, userId) {
    try {
      const existing = await this.getMaterialById(id);

      const result = await materialRepository.deleteOneById(id);

      if (!result) {
        throw new Error('Failed to delete material');
      }

      // Create notification
      if (userId) {
        const user = await userRepository.getOneById(userId);
        if (user) {
          await notificationService.notifyOnCRUD(
            'deleted',
            'Material',
            existing.name,
            userId,
            `${user.first_name} ${user.last_name}`
          );
        }
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete material');
    }
  }

  async countMaterials() {
    try {
      return await materialRepository.count();
    } catch (error) {
      throw this.handleError(error, 'Failed to count materials');
    }
  }
}

export default new MaterialService();
