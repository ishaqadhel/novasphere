import BaseService from '../../../services/index.js';
import supplierRepository from '../../../repositories/supplier/index.js';

class SupplierService extends BaseService {
  async getAllSuppliers() {
    try {
      return await supplierRepository.getAll();
    } catch (error) {
      throw this.handleError(error, 'Failed to get suppliers');
    }
  }

  async getSupplierById(id) {
    try {
      const supplier = await supplierRepository.getOneById(id);
      if (!supplier) throw new Error('Supplier not found');
      return supplier;
    } catch (error) {
      throw this.handleError(error, 'Failed to get supplier');
    }
  }

  async createSupplier(data, userId) {
    try {
      this.validateRequired(data, ['name', 'email', 'phone', 'address']);

      const supplierData = {
        ...data,
        rating: data.rating ? parseFloat(data.rating) : 0,
        is_active: data.is_active === 'true' || data.is_active === true || data.is_active === '1',
      };

      const insertId = await supplierRepository.createOne(supplierData, userId);
      return await this.getSupplierById(insertId);
    } catch (error) {
      throw this.handleError(error, 'Failed to create supplier');
    }
  }

  async updateSupplier(id, data, userId) {
    try {
      this.validateRequired(data, ['name', 'email', 'phone', 'address']);

      await this.getSupplierById(id);

      const supplierData = {
        ...data,
        rating: data.rating ? parseFloat(data.rating) : 0,
        is_active: data.is_active === 'true' || data.is_active === true || data.is_active === '1',
      };

      await supplierRepository.updateOneById(id, supplierData, userId);
      return await this.getSupplierById(id);
    } catch (error) {
      throw this.handleError(error, 'Failed to update supplier');
    }
  }

  async deleteSupplier(id) {
    try {
      await this.getSupplierById(id);
      return await supplierRepository.deleteOneById(id);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete supplier');
    }
  }
}

export default new SupplierService();
