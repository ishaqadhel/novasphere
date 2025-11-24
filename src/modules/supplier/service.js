import supplierRepository from '../../repositories/supplier/index.js';

class SupplierService {
  /**
   * 取得所有供應商列表
   */
  async getAllSuppliers() {
    return await supplierRepository.getAll();
  }

  /**
   * 取得所有「啟用中」的供應商 (用於下拉選單等)
   */
  async getActiveSuppliers() {
    return await supplierRepository.getAllActive();
  }

  /**
   * 根據 ID 取得單一供應商
   */
  async getSupplierById(id) {
    const supplier = await supplierRepository.getOneById(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  }

  /**
   * 建立供應商
   * @param {Object} data - 表單資料
   * @param {Number} userId - 操作者的 User ID (從 session 取得)
   */
  async createSupplier(data, userId) {
    // 1. 基本驗證
    if (!data.name) {
      throw new Error('Supplier name is required');
    }

    // 2. 資料格式整理 (如果需要)
    const supplierData = {
      ...data,
      rating: data.rating ? parseInt(data.rating, 10) : 0,
      is_active: data.is_active === 'true' || data.is_active === true || data.is_active === 1,
    };

    // 3. 呼叫 Repository
    const insertId = await supplierRepository.createOne(supplierData, userId);

    // 4. 回傳建立後的完整資料
    return await this.getSupplierById(insertId);
  }

  /**
   * 更新供應商
   */
  async updateSupplier(id, data, userId) {
    // 檢查是否存在
    await this.getSupplierById(id);

    // 驗證
    if (!data.name) {
      throw new Error('Supplier name is required');
    }

    const supplierData = {
      ...data,
      rating: data.rating ? parseInt(data.rating, 10) : 0,
      is_active: data.is_active === 'true' || data.is_active === true || data.is_active === 1,
    };

    const success = await supplierRepository.updateOneById(id, supplierData, userId);

    if (!success) {
      throw new Error('Update failed');
    }

    return await this.getSupplierById(id);
  }

  /**
   * 刪除供應商 (軟刪除)
   */
  async deleteSupplier(id) {
    // 檢查是否存在
    await this.getSupplierById(id);

    return await supplierRepository.deleteOneById(id);
  }
}

export default new SupplierService();
