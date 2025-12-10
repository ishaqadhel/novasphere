import databaseService from '../../services/database/index.js';

class PmrAlertLogRepository {
  constructor() {
    this.tableName = 'pmr_alert_logs';
  }

  async wasAlertSentToday(pmrId, userId) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT alert_log_id
      FROM ${this.tableName}
      WHERE project_material_requirement_id = ?
        AND user_id = ?
        AND alert_date = ?
      LIMIT 1
    `;
    const rows = await databaseService.query(query, [pmrId, userId, today]);
    return rows.length > 0;
  }

  async createAlertLog(pmrId, userId, alertType = 'pre_delay_warning') {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      INSERT INTO ${this.tableName}
      (project_material_requirement_id, user_id, alert_type, alert_date)
      VALUES (?, ?, ?, ?)
    `;
    try {
      const result = await databaseService.execute(query, [pmrId, userId, alertType, today]);
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`Alert already logged for PMR ${pmrId} to user ${userId} today`);
        return null;
      }
      throw error;
    }
  }
}

export default new PmrAlertLogRepository();
