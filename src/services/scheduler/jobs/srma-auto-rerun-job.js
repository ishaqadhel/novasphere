import { loadSrmaInputs } from '../../srma/data-loader.js';
import { runSimulation } from '../../srma/simulation-engine.js';
import { aggregateResults } from '../../srma/aggregator.js';
import srmaRepository from '../../../repositories/srma/index.js';
import notificationService from '../../notification/index.js';
import databaseService from '../../database/index.js';

class SrmaAutoRerunJob {
  constructor() {
    this.moduleId = 10; // SRMA module ID (10th in seed order)
    this.probabilityThreshold = 0.5;
    this.rerunIntervalDays = 7;
    this.nIterations = 1000; // reduced for scheduler runs to avoid blocking
  }

  async execute() {
    const startTime = Date.now();
    let runsCompleted = 0;
    let alertsSent = 0;

    try {
      const projects = await databaseService.query(
        `SELECT project_id, project_manager, srma_last_run_at
         FROM projects
         WHERE deleted_at IS NULL
           AND is_active = 1
           AND (srma_last_run_at IS NULL
                OR srma_last_run_at < DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [this.rerunIntervalDays]
      );

      console.log(`SRMA auto-rerun: found ${projects.length} projects to analyze`);

      for (const project of projects) {
        const runId = await this._runForProject(project);
        if (runId) {
          runsCompleted++;
          await this._checkAndAlert(project, runId, alertsSent);
          alertsSent++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`SRMA auto-rerun completed in ${duration}ms: ${runsCompleted} runs, ${alertsSent} alerts`);
    } catch (error) {
      console.error('SRMA auto-rerun job failed:', error.message);
    }
  }

  async _runForProject(project) {
    const runId = await srmaRepository.createRun({
      projectId: project.project_id,
      triggeredByUserId: null,
      startedAt: new Date(),
      nIterations: this.nIterations,
    });

    try {
      const inputs = await loadSrmaInputs(project.project_id);
      if (!inputs.activities || inputs.activities.length === 0) {
        await srmaRepository.updateRun(runId, {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: 'No tasks found for project',
        });
        return null;
      }

      inputs.targetDurationDays = inputs.targetDurationDays || 30;
      const iterResults = runSimulation(inputs, this.nIterations);
      const aggregated = aggregateResults(iterResults, inputs.targetDurationDays);

      await srmaRepository.updateRun(runId, {
        status: 'completed',
        onTimeProbability: aggregated.onTimeProbability,
        meanNetCost: aggregated.meanNetCost,
        finishedAt: new Date(),
      });

      await srmaRepository.saveScurve(runId, aggregated.scurvePoints);

      const actItems = [...aggregated.activityCriticality.entries()].map(([id, ci]) => ({
        project_task_id: id,
        criticality_index: ci,
      }));
      await srmaRepository.saveActivityCriticality(runId, actItems);

      const measItems = [...aggregated.measureCriticality.entries()].map(([id, data]) => ({
        mitigation_measure_id: id,
        usage_frequency: data.usage_frequency,
        avg_cost_contribution: data.avg_cost_contribution,
      }));
      await srmaRepository.saveMeasureCriticality(runId, measItems);

      await databaseService.execute(
        `UPDATE projects SET srma_on_time_probability = ?, srma_last_run_at = NOW()
         WHERE project_id = ?`,
        [aggregated.onTimeProbability, project.project_id]
      );

      return { runId, aggregated, inputs };
    } catch (error) {
      console.error(`SRMA run failed for project ${project.project_id}:`, error.message);
      await srmaRepository.updateRun(runId, {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage: error.message,
      });
      return null;
    }
  }

  async _checkAndAlert(project, runData, alertsSentSoFar) {
    if (!runData || !runData.aggregated) return;
    const { onTimeProbability } = runData.aggregated;

    if (onTimeProbability < this.probabilityThreshold) {
      const pmUsers = await notificationService.getUsersByRole('pm');
      const supervisorUsers = await notificationService.getUsersByRole('supervisor');

      const pct = Math.round(onTimeProbability * 100);
      const title = `⚠️ SRMA Alert: On-time probability dropped to ${pct}%`;
      const message =
        `Project "${runData.inputs?.project?.name || project.project_id}" has a low on-time probability of ${pct}%. ` +
        `Immediate risk mitigation is recommended.`;

      for (const user of [...pmUsers, ...supervisorUsers]) {
        const alreadySent = await srmaRepository.wasAlertSentToday(
          project.project_id,
          user.user_id
        );
        if (!alreadySent) {
          await notificationService.createNotificationForUser(
            user.user_id,
            title,
            message,
            'warning',
            this.moduleId
          );
          await srmaRepository.createAlertLog(project.project_id, user.user_id, 'probability_drop');
        }
      }
    }
  }
}

export default new SrmaAutoRerunJob();
