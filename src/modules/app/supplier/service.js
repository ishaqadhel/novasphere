import BaseService from '../../../services/index.js';
import supplierRepository from '../../../repositories/supplier/index.js';
import notificationService from '../../../services/notification/index.js';
import userRepository from '../../../repositories/user/index.js';

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
      const newSupplier = await this.getSupplierById(insertId);

      // Create notification
      const user = await userRepository.getOneById(userId);
      if (user) {
        await notificationService.notifyOnCRUD(
          'created',
          'Supplier',
          data.name,
          userId,
          `${user.first_name} ${user.last_name}`
        );
      }

      return newSupplier;
    } catch (error) {
      throw this.handleError(error, 'Failed to create supplier');
    }
  }

  async updateSupplier(id, data, userId) {
    try {
      this.validateRequired(data, ['name', 'email', 'phone', 'address']);

      const existing = await this.getSupplierById(id);

      const supplierData = {
        ...data,
        rating: data.rating ? parseFloat(data.rating) : 0,
        is_active: data.is_active === 'true' || data.is_active === true || data.is_active === '1',
      };

      await supplierRepository.updateOneById(id, supplierData, userId);
      const updated = await this.getSupplierById(id);

      // Create notification
      const user = await userRepository.getOneById(userId);
      if (user) {
        await notificationService.notifyOnCRUD(
          'updated',
          'Supplier',
          data.name || existing.name,
          userId,
          `${user.first_name} ${user.last_name}`
        );
      }

      return updated;
    } catch (error) {
      throw this.handleError(error, 'Failed to update supplier');
    }
  }

  async deleteSupplier(id, userId) {
    try {
      const existing = await this.getSupplierById(id);
      const result = await supplierRepository.deleteOneById(id);

      // Create notification
      if (userId) {
        const user = await userRepository.getOneById(userId);
        if (user) {
          await notificationService.notifyOnCRUD(
            'deleted',
            'Supplier',
            existing.name,
            userId,
            `${user.first_name} ${user.last_name}`
          );
        }
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete supplier');
    }
  }
}

export default new SupplierService();
