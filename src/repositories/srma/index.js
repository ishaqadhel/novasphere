import databaseService from '../../services/database/index.js';

class SrmaRepository {
  async createRun(data) {
    const result = await databaseService.execute(
      `INSERT INTO srma_runs
       (project_id, triggered_by_user_id, started_at, n_iterations, status, target_duration_days_at_run)
       VALUES (?, ?, ?, ?, 'running', ?)`,
      [
        data.projectId,
        data.triggeredByUserId || null,
        data.startedAt,
        data.nIterations || 5000,
        data.targetDurationDays || null,
      ]
    );
    return result.insertId;
  }

  async updateRun(runId, data) {
    await databaseService.execute(
      `UPDATE srma_runs SET status = ?, on_time_probability = ?, mean_net_cost = ?,
       finished_at = ?, error_message = ? WHERE srma_run_id = ?`,
      [
        data.status,
        data.onTimeProbability !== undefined ? data.onTimeProbability : null,
        data.meanNetCost !== undefined ? data.meanNetCost : null,
        data.finishedAt,
        data.errorMessage || null,
        runId,
      ]
    );
  }

  async saveScurve(runId, points) {
    if (!points || points.length === 0) return;
    const values = points.map((p) => `(${runId}, ${p.duration_days}, ${p.cumulative_probability})`).join(',');
    await databaseService.query(
      `INSERT INTO srma_run_scurve_point (srma_run_id, duration_days, cumulative_probability) VALUES ${values}`
    );
  }

  async saveActivityCriticality(runId, items) {
    if (!items || items.length === 0) return;
    const values = items.map((i) => `(${runId}, ${i.project_task_id}, ${i.criticality_index})`).join(',');
    await databaseService.query(
      `INSERT INTO srma_run_activity_criticality (srma_run_id, project_task_id, criticality_index) VALUES ${values}`
    );
  }

  async saveMeasureCriticality(runId, items) {
    if (!items || items.length === 0) return;
    const values = items
      .map((i) => `(${runId}, ${i.mitigation_measure_id}, ${i.usage_frequency}, ${i.avg_cost_contribution})`)
      .join(',');
    await databaseService.query(
      `INSERT INTO srma_run_measure_criticality (srma_run_id, mitigation_measure_id, usage_frequency, avg_cost_contribution) VALUES ${values}`
    );
  }

  async getLatestRunByProject(projectId) {
    const runs = await databaseService.query(
      `SELECT sr.*, p.name as project_name
       FROM srma_runs sr
       JOIN projects p ON sr.project_id = p.project_id
       WHERE sr.project_id = ? AND sr.status = 'completed'
       ORDER BY sr.finished_at DESC LIMIT 1`,
      [projectId]
    );

    if (runs.length === 0) return null;

    const run = runs[0];
    const runId = run.srma_run_id;

    const [scurve, actCrit, measCrit] = await Promise.all([
      databaseService.query(
        `SELECT duration_days, cumulative_probability FROM srma_run_scurve_point
         WHERE srma_run_id = ? ORDER BY duration_days ASC`,
        [runId]
      ),
      databaseService.query(
        `SELECT rac.project_task_id, rac.criticality_index, pt.name as task_name
         FROM srma_run_activity_criticality rac
         JOIN project_tasks pt ON rac.project_task_id = pt.project_task_id
         WHERE rac.srma_run_id = ?
         ORDER BY rac.criticality_index DESC`,
        [runId]
      ),
      databaseService.query(
        `SELECT rmc.mitigation_measure_id, rmc.usage_frequency, rmc.avg_cost_contribution,
                mm.description
         FROM srma_run_measure_criticality rmc
         JOIN mitigation_measures mm ON rmc.mitigation_measure_id = mm.mitigation_measure_id
         WHERE rmc.srma_run_id = ?
         ORDER BY rmc.usage_frequency DESC`,
        [runId]
      ),
    ]);

    return { ...run, scurve, activityCriticality: actCrit, measureCriticality: measCrit };
  }

  async getLatestRunsForAllProjects() {
    const projects = await databaseService.query(
      `SELECT project_id FROM projects WHERE deleted_at IS NULL AND is_active = 1`
    );

    const runs = [];
    for (const p of projects) {
      const run = await this.getLatestRunByProject(p.project_id);
      if (run) runs.push(run);
    }
    return runs;
  }

  async getRunHistory(projectId, limit = 10) {
    return databaseService.query(
      `SELECT srma_run_id, started_at, finished_at, status, on_time_probability, mean_net_cost, n_iterations
       FROM srma_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT ?`,
      [projectId, limit]
    );
  }

  async wasAlertSentToday(projectId, userId) {
    const today = new Date().toISOString().split('T')[0];
    const rows = await databaseService.query(
      `SELECT srma_alert_log_id FROM srma_alert_logs
       WHERE project_id = ? AND user_id = ? AND DATE(created_at) = ?
       LIMIT 1`,
      [projectId, userId, today]
    );
    return rows.length > 0;
  }

  async createAlertLog(projectId, userId, alertType = 'probability_drop') {
    const result = await databaseService.execute(
      `INSERT INTO srma_alert_logs (project_id, user_id, alert_type) VALUES (?, ?, ?)`,
      [projectId, userId, alertType]
    );
    return result.insertId;
  }
}

export default new SrmaRepository();
