import BaseService from '../../../services/index.js';
import materialCategoryRepository from '../../../repositories/material-category/index.js';

class MaterialCategoryService extends BaseService {
  constructor() {
    super();
  }

  async getAllMaterialCategories() {
    try {
      return await materialCategoryRepository.getAll();
    } catch (error) {
      throw this.handleError(error, 'Failed to get material categories');
    }
  }

  async getAllActiveMaterialCategories() {
    try {
      return await materialCategoryRepository.getAllActive();
    } catch (error) {
      throw this.handleError(error, 'Failed to get active material categories');
    }
  }

  async getMaterialCategoryById(id) {
    try {
      const materialCategory = await materialCategoryRepository.getOneById(id);

      if (!materialCategory) {
        throw new Error('Material category not found');
      }

      return materialCategory;
    } catch (error) {
      throw this.handleError(error, 'Failed to get material category');
    }
  }

  async createMaterialCategory(data) {
    try {
      this.validateRequired(data, ['name']);

      return await materialCategoryRepository.createOne(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create material category');
    }
  }

  async updateMaterialCategory(id, data) {
    try {
      this.validateRequired(data, ['name']);

      await this.getMaterialCategoryById(id);

      const result = await materialCategoryRepository.updateOneById(id, data);

      if (!result) {
        throw new Error('Failed to update material category');
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to update material category');
    }
  }

  async deleteMaterialCategory(id) {
    try {
      await this.getMaterialCategoryById(id);

      const result = await materialCategoryRepository.deleteOneById(id);

      if (!result) {
        throw new Error('Failed to delete material category');
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete material category');
    }
  }
}

export default new MaterialCategoryService();
