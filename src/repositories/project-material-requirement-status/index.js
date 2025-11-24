import databaseService from '../../services/database/index.js';

class ProjectMaterialRequirementStatusRepository {
  constructor() {
    this.tableName = 'project_material_requirement_statuses';
  }

  async getAllActive() {
    const query = `
      SELECT project_material_requirement_status_id, name 
      FROM ${this.tableName} 
      WHERE is_active = 1 AND deleted_at IS NULL
      ORDER BY project_material_requirement_status_id ASC
    `;
    return await databaseService.query(query);
  }
}

export default new ProjectMaterialRequirementStatusRepository();
