import BaseService from '../../../services/index.js';
import materialRepository from '../../../repositories/material/index.js';

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

  async createMaterial(data) {
    try {
      this.validateRequired(data, ['name', 'material_category_id']);

      return await materialRepository.createOne(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create material');
    }
  }

  async updateMaterial(id, data) {
    try {
      this.validateRequired(data, ['name', 'material_category_id']);

      await this.getMaterialById(id);

      const result = await materialRepository.updateOneById(id, data);

      if (!result) {
        throw new Error('Failed to update material');
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to update material');
    }
  }

  async deleteMaterial(id) {
    try {
      await this.getMaterialById(id);

      const result = await materialRepository.deleteOneById(id);

      if (!result) {
        throw new Error('Failed to delete material');
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
