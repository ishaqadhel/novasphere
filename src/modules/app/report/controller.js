import BaseController from '../../../controllers/index.js';
import reportService from './service.js';
// PDF export removed: Puppeteer is no longer used

class ReportController extends BaseController {
  // 1. 綜合儀表板 (Dashboard)
  // 對應企劃書：提供 "Visualized analytics tools" 和 KPI 摘要 [cite: 252]
  async index(req, res) {
    try {
      // 獲取高層次的 KPI 摘要 (例如：進行中專案數、本月預算狀況、當前延遲數)
      const kpiData = await reportService.getDashboardKPIs();
      return this.renderView(res, 'app/report/home', {
        title: 'Reports & Analytics',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        kpiData, // 傳遞 KPI 數據
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load reports home', 500, error);
    }
  }

  // 2. 專案摘要 (Project Summary)
  // 對應企劃書：監控專案進度與預算 [cite: 209, 335]
  async projectSummary(req, res) {
    try {
      const reportData = await reportService.getProjectSummary();
      // Format budget numbers for display: no decimals, thousand separators
      const fmt = (v) => {
        if (v === null || v === undefined) return '0';
        const n = Number(v);
        if (!isFinite(n)) return String(v);
        if (globalThis.Intl && typeof globalThis.Intl.NumberFormat === 'function') {
          return new globalThis.Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
            Math.round(n)
          );
        }
        return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };

      // Format stats
      if (reportData && reportData.stats) {
        reportData.stats.formatted_total_budget = fmt(reportData.stats.total_budget);
        reportData.stats.formatted_average_budget = fmt(reportData.stats.average_budget);
      }

      // Format each project's budget
      if (Array.isArray(reportData.projects)) {
        const formatDate = (v) => {
          if (!v) return '';
          const d = new Date(v);
          if (!isFinite(d)) {
            // fallback: strip GMT/parenthesis
            return String(v)
              .replace(/\s*GMT[^\s]*/g, '')
              .replace(/\s*\([^)]*\)/g, '')
              .trim();
          }
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

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

  // 3. 風險與延遲預警 (Risk & Delay Alerts) - *已移除 AI*
  // 對應企劃書 MVP 功能 "Pre-Delay Alerts"：針對即將到期或已延遲的項目發出警報，但不包含 AI 預測
  async riskAnalysis(req, res) {
    try {
      // 獲取 "已延遲" 與 "即將到期" 的專案或材料清單 (Rule-based check)
      const rawReportData = await reportService.getDelayRisks();
      const reportData = rawReportData || {};

      // Normalize arrays to avoid template runtime errors
      const delayedProjects = Array.isArray(reportData.delayedProjects)
        ? reportData.delayedProjects
        : [];
      const upcomingRisks = Array.isArray(reportData.upcomingRisks) ? reportData.upcomingRisks : [];

      // Add convenience flags for templates to avoid Mustache iterating over arrays
      reportData.delayedProjects = delayedProjects;
      reportData.upcomingRisks = upcomingRisks;
      reportData.hasDelayedProjects = delayedProjects.length > 0;
      reportData.hasUpcomingRisks = upcomingRisks.length > 0;

      // Ensure any date fields do not render timezone strings like "GMT+0800" — provide formatted fields
      const formatDate = (v) => {
        if (!v) return '';
        const d = new Date(v);
        if (!isFinite(d)) {
          // fallback: strip GMT/parenthesis
          return String(v)
            .replace(/\s*GMT[^\s]*/g, '')
            .replace(/\s*\([^)]*\)/g, '')
            .trim();
        }
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

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
        title: 'Delay Risks & Schedule Alerts', // 標題改為強調時程警報
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load risk analysis report', 500, error);
    }
  }

  // 4. 材料用量 (Material Usage)
  // 對應企劃書：追蹤材料訂單與交付狀況 [cite: 212]
  async materialUsage(req, res) {
    try {
      const rawReportData = await reportService.getMaterialUsage();
      const reportData = rawReportData || {};

      // Defensive defaults to prevent template runtime errors when DB returns empty/null
      reportData.stats = reportData.stats || {};
      reportData.mostUsedMaterials = Array.isArray(reportData.mostUsedMaterials)
        ? reportData.mostUsedMaterials
        : [];
      reportData.materialsByCategory = Array.isArray(reportData.materialsByCategory)
        ? reportData.materialsByCategory
        : [];
      reportData.materialsByProject = Array.isArray(reportData.materialsByProject)
        ? reportData.materialsByProject
        : [];

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

  // 5. 品質控管報告 (Quality Control)
  // 對應企劃書：Supervisor 需標記不合規材料 (Mark non-compliant materials)
  // 這有助於解決因不良材料導致的重工問題 [cite: 109]
  async qualityControl(req, res) {
    try {
      // 針對退貨、不合格材料的統計報告
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

  // 6. 供應商績效 (Supplier Performance)
  // 對應企劃書：依據價格、品質、交期評估供應商 [cite: 140, 206]
  async supplierPerformance(req, res) {
    try {
      const reportData = await reportService.getSupplierPerformance();
      return this.renderView(res, 'app/report/supplier-performance', {
        title: 'Supplier Performance Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load supplier performance report', 500, error);
    }
  }

  // 7. 報表導出功能 (Export Generator)
  // 對應企劃書：每週/每月報告生成器，以 PDF 格式交付 [cite: 282, 283]
  async exportReport(req, res) {
    try {
      const { type, format } = req.query; // 例如 type='weekly', format='pdf'

      // Whitelist allowed report types and formats (CSV/PDF removed; XLSX only)
      const allowedTypes = [
        'project-summary',
        'supplier-performance',
        'risk-analysis',
        'quality-control',
        'material-usage',
      ];
      const allowedFormats = ['xlsx'];

      if (!type || !format || !allowedTypes.includes(type) || !allowedFormats.includes(format)) {
        return this.sendError(res, 'Invalid report type or format (only XLSX supported)', 400);
      }

      // Generate XLSX buffer from service
      const fileBuffer = await reportService.generateExportFile(type, format);
      const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      res.setHeader('Content-Type', contentType);
      const filename = `report-${type}.xlsx`;
      // Use filename* to support UTF-8 filenames and fallback filename
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      if (Buffer.isBuffer(fileBuffer)) {
        res.setHeader('Content-Length', fileBuffer.length);
        return res.send(fileBuffer);
      }
      // Non-buffer fallback
      const payload = fileBuffer == null ? '' : String(fileBuffer);
      res.setHeader('Content-Length', Buffer.byteLength(payload, 'utf-8'));
      return res.send(payload);
    } catch (error) {
      return this.sendError(res, 'Failed to generate report file', 500, error);
    }
  }
}

export default new ReportController();
