import pmrRepository from '../../../repositories/project-material-requirement/index.js';

class ProjectMaterialRequirementService {
  /**
   * 取得所有需求清單
   */
  async getAllRequirements() {
    return await pmrRepository.getAll();
  }

  /**
   * 取得特定專案的需求清單
   */
  async getRequirementsByProjectId(projectId) {
    return await pmrRepository.getByProjectId(projectId);
  }

  /**
   * 根據 ID 取得單一需求
   */
  async getRequirementById(id) {
    const item = await pmrRepository.getOneById(id);
    if (!item) {
      throw new Error('Requirement not found');
    }
    return item;
  }

  /**
   * 建立需求
   */
  async createRequirement(data, userId) {
    // 1. 驗證必填欄位
    if (!data.project_id || !data.material_id || !data.supplier_id || !data.quantity) {
      throw new Error('Project, Material, Supplier, and Quantity are required');
    }

    // 2. 處理數值與預設值
    const price = parseFloat(data.price || 0);
    const quantity = parseInt(data.quantity, 10);
    // 如果沒有填總價，自動計算 (單價 * 數量)
    const total_price = data.total_price ? parseFloat(data.total_price) : price * quantity;

    const prepareData = {
      ...data,
      quantity,
      price,
      total_price,
      status: data.status || 1, // 預設狀態 1 (例如: Pending)
      arrived_date: data.arrived_date || new Date(),
      is_active: true,
    };

    // 3. 寫入資料庫
    const insertId = await pmrRepository.createOne(prepareData, userId);

    // 4. 回傳完整資料 (包含 JOIN 的名稱)
    return await this.getRequirementById(insertId);
  }

  /**
   * 刪除需求
   */
  async deleteRequirement(id) {
    await this.getRequirementById(id); // 檢查是否存在
    return await pmrRepository.deleteOneById(id);
  }

  /**
   * 更新需求
   */
  async update(id, data, userId) {
    await this.getRequirementById(id); // 檢查是否存在

    // 處理數值
    const price = parseFloat(data.price || 0);
    const quantity = parseInt(data.quantity, 10);
    const total_price = data.total_price ? parseFloat(data.total_price) : price * quantity;

    const prepareData = {
      ...data,
      quantity,
      price,
      total_price,
      arrived_date: data.arrived_date || null,
    };

    await pmrRepository.updateOne(id, prepareData, userId);
    return await this.getRequirementById(id);
  }
}

export default new ProjectMaterialRequirementService();
