import BaseService from '../../../services/index.js';
import pmrRepository from '../../../repositories/project-material-requirement/index.js';
import notificationService from '../../../services/notification/index.js';
import userRepository from '../../../repositories/user/index.js';
import materialRepository from '../../../repositories/material/index.js';

class ProjectMaterialRequirementService extends BaseService {
  async getRequirementsByProjectId(projectId) {
    return await pmrRepository.getByProjectId(projectId);
  }

  async getRequirementById(id) {
    const item = await pmrRepository.getOneById(id);
    if (!item) {
      throw new Error('Requirement not found');
    }
    return item;
  }

  async createRequirement(data, userId) {
    this.validateRequired(data, [
      'project_id',
      'material_id',
      'supplier_id',
      'quantity',
      'price',
      'arrived_date',
    ]);

    const quantity = parseInt(data.quantity, 10);
    const price = parseFloat(data.price);
    const total_price = price * quantity;

    // Default Status: 1 (Pending)
    const status = 1;

    const prepareData = {
      ...data,
      quantity,
      price,
      total_price,
      status,
      unit_id: data.unit_id,
      is_active: true,
    };

    const insertId = await pmrRepository.createOne(prepareData, userId);
    const newRequirement = await this.getRequirementById(insertId);

    // Create notification
    const user = await userRepository.getOneById(userId);
    const material = await materialRepository.getOneById(data.material_id);
    if (user && material) {
      await notificationService.notifyOnCRUD(
        'created',
        'Project Material Requirement',
        material.name,
        userId,
        `${user.first_name} ${user.last_name}`
      );
    }

    return newRequirement;
  }

  async update(id, data, userId) {
    const existing = await this.getRequirementById(id);

    this.validateRequired(data, [
      'material_id',
      'supplier_id',
      'quantity',
      'price',
      'arrived_date',
    ]);

    const quantity = parseInt(data.quantity, 10);
    const price = parseFloat(data.price);
    const total_price = price * quantity;
    const newStatusId = parseInt(data.status, 10);

    const DELIVERED_STATUS_ID = 4;

    let actual_arrived_date = data.actual_arrived_date;
    let good_quantity = data.good_quantity;
    let bad_quantity = data.bad_quantity;

    if (newStatusId === DELIVERED_STATUS_ID) {
      if (!actual_arrived_date || good_quantity === '' || bad_quantity === '') {
        throw new Error('For Delivered status: Actual Date, Good Qty, and Bad Qty are required');
      }
      const good = parseInt(good_quantity || 0);
      const bad = parseInt(bad_quantity || 0);
      if (good + bad !== quantity) {
        throw new Error(`Total quantity (${quantity}) must match Good (${good}) + Bad (${bad})`);
      }
    }
    // ---------------------------------------

    const prepareData = {
      ...existing,
      ...data,
      quantity,
      price,
      total_price,
      unit_id: data.unit_id,
      status: newStatusId,
      actual_arrived_date: actual_arrived_date || null,
      good_quantity: good_quantity ? parseInt(good_quantity) : 0,
      bad_quantity: bad_quantity ? parseInt(bad_quantity) : 0,
    };

    await pmrRepository.updateOneById(id, prepareData, userId);
    const updatedRequirement = await this.getRequirementById(id);

    // Create notification
    const user = await userRepository.getOneById(userId);
    const material = await materialRepository.getOneById(data.material_id || existing.material_id);
    if (user && material) {
      await notificationService.notifyOnCRUD(
        'updated',
        'Project Material Requirement',
        material.name,
        userId,
        `${user.first_name} ${user.last_name}`
      );
    }

    return updatedRequirement;
  }

  async deleteRequirement(id, userId) {
    const existing = await this.getRequirementById(id);
    const result = await pmrRepository.deleteOneById(id, userId);

    // Create notification
    const user = await userRepository.getOneById(userId);
    const material = await materialRepository.getOneById(existing.material_id);
    if (user && material) {
      await notificationService.notifyOnCRUD(
        'deleted',
        'Project Material Requirement',
        material.name,
        userId,
        `${user.first_name} ${user.last_name}`
      );
    }

    return result;
  }
}

export default new ProjectMaterialRequirementService();
