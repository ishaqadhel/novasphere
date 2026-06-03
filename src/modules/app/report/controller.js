import BaseController from '../../../controllers/index.js';
import reportService from './service.js';
import srmaRepository from '../../../repositories/srma/index.js';
import { loadSrmaInputs } from '../../../services/srma/data-loader.js';
import { runSimulation } from '../../../services/srma/simulation-engine.js';
import { aggregateResults } from '../../../services/srma/aggregator.js';
import databaseService from '../../../services/database/index.js';

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (!isFinite(d)) return String(v).replace(/\s*GMT[^\s]*/g, '').replace(/\s*\([^)]*\)/g, '').trim();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fmt = (v) => {
  if (v === null || v === undefined) return '0';
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const safeJson = (obj) =>
  JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));

function buildAdvisoryText(run, topMeasure, topActivity) {
  const pct = Math.round((Number(run.on_time_probability) || 0) * 100);
  const risk = pct < 50 ? 'HIGH RISK' : pct < 70 ? 'MODERATE RISK' : 'LOW RISK';
  let text = `P(on-time) = ${pct}% [${risk}]`;
  if (topActivity) text += `; critical path at: ${topActivity.task_name}`;
  if (topMeasure) {
    text += `; recommended: ${topMeasure.description}`;
    if (topMeasure.avg_cost_contribution) {
      text += ` — est. cost: NT$${Number(topMeasure.avg_cost_contribution).toLocaleString()}`;
    }
  }
  return text;
}

class ReportController extends BaseController {
  async index(req, res) {
    try {
      const kpiData = await reportService.getDashboardKPIs();
      return this.renderView(res, 'app/report/home', {
        title: 'Reports & Analytics',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        kpiData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load reports home', 500, error);
    }
  }

  async projectSummary(req, res) {
    try {
      const reportData = await reportService.getProjectSummary();

      if (reportData && reportData.stats) {
        reportData.stats.formatted_total_budget = fmt(reportData.stats.total_budget);
        reportData.stats.formatted_average_budget = fmt(reportData.stats.average_budget);
      }

      if (Array.isArray(reportData.projects)) {
        reportData.projects = reportData.projects.map((p) => ({
          ...p,
          formatted_budget: fmt(p.budget),
          formatted_start_date: formatDate(p.start_date),
          formatted_end_date: formatDate(p.end_date),
        }));
      }

      return this.renderView(res, 'app/report/project-summary', {
        title: 'Project Summary Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load project summary report', 500, error);
    }
  }

  async riskAnalysis(req, res) {
    try {
      const rawReportData = await reportService.getDelayRisks();
      const reportData = rawReportData || {};

      const delayedProjects = Array.isArray(reportData.delayedProjects) ? reportData.delayedProjects : [];
      const upcomingRisks = Array.isArray(reportData.upcomingRisks) ? reportData.upcomingRisks : [];

      reportData.delayedProjects = delayedProjects;
      reportData.upcomingRisks = upcomingRisks;
      reportData.hasDelayedProjects = delayedProjects.length > 0;
      reportData.hasUpcomingRisks = upcomingRisks.length > 0;

      if (delayedProjects.length > 0) {
        reportData.delayedProjects = delayedProjects.map((p) => ({
          ...p,
          formatted_end_date: formatDate(p.end_date),
        }));
      }

      if (upcomingRisks.length > 0) {
        reportData.upcomingRisks = upcomingRisks.map((p) => ({
          ...p,
          formatted_end_date: formatDate(p.end_date),
        }));
      }

      return this.renderView(res, 'app/report/risk-analysis', {
        title: 'Delay Risks & Schedule Alerts',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load risk analysis report', 500, error);
    }
  }

  async materialUsage(req, res) {
    try {
      const rawReportData = await reportService.getMaterialUsage();
      const reportData = rawReportData || {};
      reportData.stats = reportData.stats || {};
      reportData.mostUsedMaterials = Array.isArray(reportData.mostUsedMaterials) ? reportData.mostUsedMaterials : [];
      reportData.materialsByCategory = Array.isArray(reportData.materialsByCategory) ? reportData.materialsByCategory : [];
      reportData.materialsByProject = Array.isArray(reportData.materialsByProject) ? reportData.materialsByProject : [];

      return this.renderView(res, 'app/report/material-usage', {
        title: 'Material Usage Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load material usage report', 500, error);
    }
  }

  async qualityControl(req, res) {
    try {
      const reportData = await reportService.getQualityIssues();
      return this.renderView(res, 'app/report/quality-control', {
        title: 'Quality Control Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load quality control report', 500, error);
    }
  }

  // F1: Enhanced supplier performance with charts + at-risk/top-performer sections
  async supplierPerformance(req, res) {
    try {
      const [perfData, trends] = await Promise.all([
        reportService.getSupplierPerformance(),
        reportService.getSupplierTrends(),
      ]);

      const reportData = perfData;

      // Split suppliers
      const atRiskSuppliers = (reportData.suppliers || []).filter((s) => Number(s.is_at_risk) === 1);
      const topPerformers = (reportData.suppliers || []).filter(
        (s) => Number(s.rating) >= 4.0 && Number(s.is_at_risk) === 0
      );

      // Build Chart.js datasets for trend line (top 5 by rating)
      const top5 = (reportData.topRatedSuppliers || []).slice(0, 5);
      const top5Ids = new Set(top5.map((s) => s.supplier_id));
      const allMonths = [...new Set(trends.map((t) => t.month))].sort();

      const trendDatasets = top5.map((s) => {
        const supplierTrends = trends.filter((t) => t.supplier_id === s.supplier_id);
        const monthMap = new Map(supplierTrends.map((t) => [t.month, Number(t.avg_rating)]));
        return {
          label: s.name,
          data: allMonths.map((m) => monthMap.get(m) || null),
          fill: false,
          tension: 0.3,
        };
      });

      const trendsJson = safeJson({
        labels: allMonths,
        datasets: trendDatasets,
      });

      // On-time rate bar chart data
      const onTimeData = (reportData.suppliers || [])
        .filter((s) => s.on_time_rate !== null)
        .sort((a, b) => Number(b.on_time_rate) - Number(a.on_time_rate))
        .slice(0, 15);

      const onTimeRatesJson = safeJson({
        labels: onTimeData.map((s) => s.name),
        datasets: [
          {
            label: 'On-Time Rate %',
            data: onTimeData.map((s) => Number(s.on_time_rate)),
            backgroundColor: onTimeData.map((s) =>
              Number(s.on_time_rate) < 80 ? 'rgba(220,53,69,0.7)' : 'rgba(25,135,84,0.7)'
            ),
          },
        ],
      });

      // Defect rate bar chart data
      const defectData = (reportData.suppliers || [])
        .filter((s) => s.defect_rate !== null)
        .sort((a, b) => Number(b.defect_rate) - Number(a.defect_rate))
        .slice(0, 15);

      const defectRatesJson = safeJson({
        labels: defectData.map((s) => s.name),
        datasets: [
          {
            label: 'Defect Rate %',
            data: defectData.map((s) => Number(s.defect_rate)),
            backgroundColor: defectData.map((s) =>
              Number(s.defect_rate) > 5 ? 'rgba(220,53,69,0.7)' : 'rgba(255,193,7,0.7)'
            ),
          },
        ],
      });

      // Add threshold badges for at-risk suppliers
      const atRiskWithBadges = atRiskSuppliers.map((s) => {
        const badges = [];
        if (Number(s.rating) < 2.0) badges.push({ text: 'Low Rating', cls: 'bg-danger' });
        if (Number(s.defect_rate) > 5) badges.push({ text: 'High Defect', cls: 'bg-warning text-dark' });
        if (s.on_time_rate !== null && Number(s.on_time_rate) < 80) badges.push({ text: 'Late Delivery', cls: 'bg-danger' });
        return { ...s, badges, hasBadges: badges.length > 0 };
      });

      return this.renderView(res, 'app/report/supplier-performance', {
        title: 'Supplier Performance Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
        trendsJson,
        onTimeRatesJson,
        defectRatesJson,
        atRiskSuppliers: atRiskWithBadges,
        topPerformers,
        hasAtRisk: atRiskWithBadges.length > 0,
        hasTopPerformers: topPerformers.length > 0,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load supplier performance report', 500, error);
    }
  }

  // F2: Predictive delay view
  async predictiveDelay(req, res) {
    try {
      const projects = await databaseService.query(
        `SELECT project_id, name FROM projects WHERE deleted_at IS NULL AND is_active = 1 ORDER BY project_id`
      );

      const runsData = [];
      for (const project of projects) {
        const run = await srmaRepository.getLatestRunByProject(project.project_id);
        if (run) {
          const topActivity = (run.activityCriticality || [])[0] || null;
          const topMeasure = (run.measureCriticality || [])[0] || null;
          const advisoryText = buildAdvisoryText(run, topMeasure, topActivity);

          const pct = Math.round((Number(run.on_time_probability) || 0) * 100);
          let alertClass = 'alert-success';
          if (pct < 50) alertClass = 'alert-danger';
          else if (pct < 70) alertClass = 'alert-warning';

          const scurveJson = safeJson({
            labels: (run.scurve || []).map((p) => p.duration_days),
            datasets: [
              {
                label: 'Cumulative Probability',
                data: (run.scurve || []).map((p) => Number(p.cumulative_probability) * 100),
                fill: true,
                backgroundColor: 'rgba(13,110,253,0.1)',
                borderColor: 'rgba(13,110,253,0.8)',
                tension: 0.3,
              },
            ],
          });

          const actCritJson = safeJson({
            labels: (run.activityCriticality || []).slice(0, 10).map((a) => a.task_name),
            datasets: [
              {
                label: 'Criticality Index',
                data: (run.activityCriticality || []).slice(0, 10).map((a) => Number(a.criticality_index)),
                backgroundColor: 'rgba(220,53,69,0.7)',
              },
            ],
          });

          const history = await srmaRepository.getRunHistory(project.project_id, 5);
          const historyMapped = history.map((h) => ({
            ...h,
            started_at_fmt: formatDate(h.started_at),
            finished_at_fmt: formatDate(h.finished_at),
            probability_pct: h.on_time_probability !== null
              ? Math.round(Number(h.on_time_probability) * 100)
              : null,
            mean_net_cost_fmt: h.mean_net_cost !== null ? fmt(h.mean_net_cost) : 'N/A',
          }));

          runsData.push({
            project_id: project.project_id,
            project_name: project.name,
            run,
            advisoryText,
            alertClass,
            probability_pct: pct,
            scurveJson,
            actCritJson,
            measureCriticality: (run.measureCriticality || []).map((m) => ({
              ...m,
              usage_pct: Math.round(Number(m.usage_frequency) * 100),
              cost_fmt: fmt(m.avg_cost_contribution),
            })),
            hasMeasures: (run.measureCriticality || []).length > 0,
            hasActivity: (run.activityCriticality || []).length > 0,
            history: historyMapped,
            hasHistory: historyMapped.length > 0,
            targetDuration: run.target_duration_days_at_run,
          });
        }
      }

      const runsDataJson = safeJson(
        runsData.map((rd) => ({
          project_id: rd.project_id,
          scurveJson: rd.scurveJson,
          actCritJson: rd.actCritJson,
        }))
      );

      return this.renderView(res, 'app/report/predictive-delay', {
        title: 'Predictive Delay Analysis (SRMA)',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        projects,
        runsData,
        runsDataJson,
        hasRuns: runsData.length > 0,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load predictive delay report', 500, error);
    }
  }

  // F2: Run SRMA simulation for a project
  async runSrma(req, res) {
    try {
      const projectId = parseInt(req.body?.projectId || req.query?.projectId, 10);
      if (!projectId || isNaN(projectId)) {
        return this.sendError(res, 'projectId is required', 400);
      }

      const userId = this.getUserId(req);

      const inputs = await loadSrmaInputs(projectId);

      const runId = await srmaRepository.createRun({
        projectId,
        triggeredByUserId: userId,
        startedAt: new Date(),
        nIterations: 2000,
        targetDurationDays: inputs.targetDurationDays,
      });

      try {

        if (!inputs.activities || inputs.activities.length === 0) {
          await srmaRepository.updateRun(runId, {
            status: 'failed',
            finishedAt: new Date(),
            errorMessage: 'No tasks found for project',
          });
          return res.redirect('/app/report/predictive-delay?error=no_tasks');
        }

        const iterResults = runSimulation(inputs, 2000);
        const aggregated = aggregateResults(iterResults, inputs.targetDurationDays);

        await srmaRepository.updateRun(runId, {
          status: 'completed',
          onTimeProbability: aggregated.onTimeProbability,
          meanNetCost: aggregated.meanNetCost,
          finishedAt: new Date(),
        });

        // Save scurve
        await srmaRepository.saveScurve(runId, aggregated.scurvePoints);

        // Save activity criticality
        const actItems = [...aggregated.activityCriticality.entries()].map(([id, ci]) => ({
          project_task_id: id,
          criticality_index: ci,
        }));
        await srmaRepository.saveActivityCriticality(runId, actItems);

        // Save measure criticality
        const measItems = [...aggregated.measureCriticality.entries()].map(([id, data]) => ({
          mitigation_measure_id: id,
          usage_frequency: data.usage_frequency,
          avg_cost_contribution: data.avg_cost_contribution,
        }));
        await srmaRepository.saveMeasureCriticality(runId, measItems);

        // Update project cache
        await databaseService.execute(
          `UPDATE projects SET srma_on_time_probability = ?, srma_last_run_at = NOW() WHERE project_id = ?`,
          [aggregated.onTimeProbability, projectId]
        );
      } catch (simError) {
        await srmaRepository.updateRun(runId, {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: simError.message,
        });
        console.error('SRMA simulation error:', simError.message);
      }

      return res.redirect('/app/report/predictive-delay');
    } catch (error) {
      return this.sendError(res, 'Failed to run SRMA', 500, error);
    }
  }

  // F3: In-depth analytics
  async inDepthAnalytics(req, res) {
    try {
      const { start, end, projectId, kpi } = req.query;
      const filters = {
        startDate: start || null,
        endDate: end || null,
        projectId: projectId ? parseInt(projectId, 10) : null,
        kpi: kpi || 'all',
      };

      const analyticsData = await reportService.getInDepthAnalytics(filters);

      const allProjects = await databaseService.query(
        `SELECT project_id, name FROM projects WHERE deleted_at IS NULL ORDER BY project_id`
      );

      // Serialize arrays for Chart.js
      const scheduleChartJson = safeJson({
        labels: analyticsData.scheduleKPIs.map((p) => p.name),
        datasets: [
          {
            label: 'SPI',
            data: analyticsData.scheduleKPIs.map((p) => Number(p.spi) || 0),
            backgroundColor: analyticsData.scheduleKPIs.map((p) =>
              Number(p.spi) >= 1.0 ? 'rgba(25,135,84,0.7)' : 'rgba(220,53,69,0.7)'
            ),
          },
        ],
      });

      const qualityChartJson = safeJson({
        labels: analyticsData.qualityTrend.map((m) => m.month),
        datasets: [
          {
            label: 'Defect Rate %',
            data: analyticsData.qualityTrend.map((m) => Number(m.defect_rate) || 0),
            borderColor: 'rgba(220,53,69,0.8)',
            backgroundColor: 'rgba(220,53,69,0.1)',
            fill: true,
            tension: 0.3,
          },
        ],
      });

      const budgetChartJson = safeJson({
        labels: analyticsData.budgetKPIs.map((p) => p.name),
        datasets: [
          {
            label: 'Budget (NT$)',
            data: analyticsData.budgetKPIs.map((p) => Number(p.budget) || 0),
            backgroundColor: 'rgba(13,110,253,0.7)',
            yAxisID: 'y',
          },
          {
            label: 'Total Orders',
            data: analyticsData.budgetKPIs.map((p) => Number(p.total_orders) || 0),
            backgroundColor: 'rgba(255,193,7,0.7)',
            yAxisID: 'y1',
          },
        ],
      });

      const completionChartJson = safeJson({
        labels: analyticsData.scheduleKPIs.map((p) => p.name),
        datasets: [
          {
            label: 'Task Completion %',
            data: analyticsData.scheduleKPIs.map((p) => Number(p.task_completion_rate) || 0),
            backgroundColor: 'rgba(13,202,240,0.7)',
          },
        ],
      });

      const scheduleKPIsFormatted = analyticsData.scheduleKPIs.map((p) => ({
        ...p,
        spi_class: Number(p.spi) >= 1.0 ? 'text-success' : 'text-danger',
        overdue_class: Number(p.days_overdue) > 0 ? 'text-danger' : 'text-success',
        start_date_fmt: formatDate(p.start_date),
        end_date_fmt: formatDate(p.end_date),
      }));

      const isHtmx = req.headers['hx-request'] === 'true';
      const viewName = isHtmx
        ? 'app/report/in-depth-analytics-partial'
        : 'app/report/in-depth-analytics';

      return this.renderView(res, viewName, {
        title: 'In-Depth Performance Analytics',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        summary: analyticsData.summary,
        scheduleKPIs: scheduleKPIsFormatted,
        qualityTrend: analyticsData.qualityTrend,
        budgetKPIs: analyticsData.budgetKPIs,
        filters: {
          ...filters,
          startValue: start || '',
          endValue: end || '',
          projectIdValue: projectId || '',
          kpiValue: kpi || 'all',
        },
        allProjects,
        scheduleChartJson,
        qualityChartJson,
        budgetChartJson,
        completionChartJson,
        hasScheduleData: scheduleKPIsFormatted.length > 0,
        hasQualityData: analyticsData.qualityTrend.length > 0,
        hasBudgetData: analyticsData.budgetKPIs.length > 0,
        spiClass: Number(analyticsData.summary.avg_spi) >= 1.0 ? 'text-success' : 'text-danger',
        defectClass: Number(analyticsData.summary.avg_defect_rate) > 5 ? 'text-danger' : 'text-success',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load in-depth analytics', 500, error);
    }
  }

  async exportReport(req, res) {
    try {
      const { type, format } = req.query;

      const allowedTypes = [
        'project-summary', 'supplier-performance', 'risk-analysis', 'quality-control', 'material-usage',
      ];
      const allowedFormats = ['xlsx', 'pdf'];

      if (!type || !format || !allowedTypes.includes(type) || !allowedFormats.includes(format)) {
        return this.sendError(res, 'Invalid report type or format (XLSX and PDF supported)', 400);
      }

      if (format === 'pdf') {
        const pdfBuffer = await reportService.generatePdfReport(type);
        res.setHeader('Content-Type', 'application/pdf');
        const filename = `report-${type}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      }

      const fileBuffer = await reportService.generateExportFile(type, format);
      const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      res.setHeader('Content-Type', contentType);
      const filename = `report-${type}.xlsx`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      if (Buffer.isBuffer(fileBuffer)) {
        res.setHeader('Content-Length', fileBuffer.length);
        return res.send(fileBuffer);
      }
      const payload = fileBuffer == null ? '' : String(fileBuffer);
      res.setHeader('Content-Length', Buffer.byteLength(payload, 'utf-8'));
      return res.send(payload);
    } catch (error) {
      return this.sendError(res, 'Failed to generate report file', 500, error);
    }
  }
}

export default new ReportController();
