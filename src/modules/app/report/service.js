import databaseService from '../../../services/database/index.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

class ReportService {
  async getDashboardKPIs() {
    try {
      const query = `
        SELECT
          (SELECT COUNT(*) FROM projects WHERE is_active = 1) as active_projects,
          (SELECT COUNT(*) FROM projects WHERE is_active = 1 AND end_date < CURDATE()) as delayed_projects,
          (SELECT COUNT(*) FROM suppliers WHERE is_active = 1) as active_suppliers,
          (SELECT ROUND(IFNULL(SUM(bad_quantity), 0) / IFNULL(SUM(quantity), 1) * 100, 2)
           FROM project_material_requirements) as overall_defect_rate
      `;
      const result = await databaseService.query(query);
      return result[0];
    } catch (error) {
      throw new Error(`Failed to get dashboard KPIs: ${error.message}`);
    }
  }

  async getDelayRisks() {
    try {
      const delayedProjectsQuery = `
        SELECT
          p.project_id, p.name, p.end_date,
          DATEDIFF(CURDATE(), p.end_date) as days_overdue,
          CONCAT(u.first_name, ' ', u.last_name) as manager_name
        FROM projects p
        LEFT JOIN users u ON p.project_manager = u.user_id
        WHERE p.is_active = 1 AND p.end_date < CURDATE()
        ORDER BY days_overdue DESC
      `;

      const upcomingRisksQuery = `
        SELECT
          p.project_id, p.name, p.end_date,
          DATEDIFF(p.end_date, CURDATE()) as days_remaining,
          (
            SELECT COUNT(*)
            FROM project_tasks pt
            LEFT JOIN project_task_statuses pts ON pt.project_task_status_id = pts.project_task_status_id
            WHERE pt.project_id = p.project_id
              AND pt.deleted_at IS NULL
              AND (pts.name IS NULL OR pts.name != 'Completed')
          ) as remaining_tasks
        FROM projects p
        WHERE p.is_active = 1
          AND p.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY days_remaining ASC
      `;

      const [delayedProjects, upcomingRisks] = await Promise.all([
        databaseService.query(delayedProjectsQuery),
        databaseService.query(upcomingRisksQuery),
      ]);

      return {
        delayedProjects,
        upcomingRisks,
        riskSummary: {
          total_delayed: delayedProjects.length,
          total_upcoming: upcomingRisks.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get risk analysis: ${error.message}`);
    }
  }

  async getQualityIssues() {
    try {
      const qualityQuery = `
        SELECT
          m.material_id, m.name as material_name, s.name as supplier_name,
          SUM(pmr.bad_quantity) as total_defects,
          SUM(pmr.quantity) as total_delivered,
          ROUND(SUM(pmr.bad_quantity) / NULLIF(SUM(pmr.quantity), 0) * 100, 2) as defect_rate,
          s.rating as current_supplier_rating
        FROM project_material_requirements pmr
        JOIN materials m ON pmr.material_id = m.material_id
        JOIN suppliers s ON pmr.supplier_id = s.supplier_id
        WHERE pmr.bad_quantity > 0 AND pmr.deleted_at IS NULL
        GROUP BY m.material_id, s.supplier_id, m.name, s.name, s.rating
        ORDER BY total_defects DESC
        LIMIT 20
      `;

      const stats = await databaseService.query(qualityQuery);
      const processed = stats.map((row) => {
        const defectRate = Number(row.defect_rate) || 0;
        const is_high_defect = defectRate > 5;
        return {
          ...row,
          defect_rate: defectRate,
          is_high_defect,
          defect_rate_class: is_high_defect ? 'text-danger' : 'text-dark',
          defect_bar_class: is_high_defect ? 'bg-danger' : 'bg-warning',
        };
      });

      return { qualityStats: processed };
    } catch (error) {
      throw new Error(`Failed to get quality report: ${error.message}`);
    }
  }

  // F1: Enhanced supplier performance with on-time rate, defect rate, at-risk flag
  async getSupplierPerformance() {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_suppliers,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_suppliers,
          COALESCE(AVG(rating), 0) as average_rating,
          COALESCE(MAX(rating), 0) as highest_rating,
          COALESCE(MIN(rating), 0) as lowest_rating
        FROM suppliers
        WHERE deleted_at IS NULL
      `;
      const stats = await databaseService.query(statsQuery);

      const suppliersQuery = `
        SELECT
          s.supplier_id, s.name, s.email, s.phone, s.rating, s.is_active,
          COUNT(DISTINCT pmr.project_id) AS projects_count,
          ROUND(AVG(sr.rating), 2) AS avg_detailed_rating,
          COUNT(sr.supplier_rating_id) AS rating_count,
          ROUND(
            SUM(CASE WHEN pmr.actual_arrived_date <= pmr.arrived_date AND pmr.actual_arrived_date IS NOT NULL THEN 1 ELSE 0 END)
            / NULLIF(SUM(CASE WHEN pmr.actual_arrived_date IS NOT NULL THEN 1 ELSE 0 END), 0) * 100, 2
          ) AS on_time_rate,
          ROUND(SUM(pmr.bad_quantity) / NULLIF(SUM(pmr.quantity), 0) * 100, 2) AS defect_rate,
          CASE WHEN
            COALESCE(s.rating, 0) < 2.0
            OR ROUND(SUM(pmr.bad_quantity) / NULLIF(SUM(pmr.quantity), 0) * 100, 2) > 5
            OR ROUND(
                 SUM(CASE WHEN pmr.actual_arrived_date <= pmr.arrived_date AND pmr.actual_arrived_date IS NOT NULL THEN 1 ELSE 0 END)
                 / NULLIF(SUM(CASE WHEN pmr.actual_arrived_date IS NOT NULL THEN 1 ELSE 0 END), 0) * 100, 2
               ) < 80
          THEN 1 ELSE 0 END AS is_at_risk
        FROM suppliers s
        LEFT JOIN project_material_requirements pmr ON s.supplier_id = pmr.supplier_id AND pmr.deleted_at IS NULL
        LEFT JOIN supplier_ratings sr ON s.supplier_id = sr.supplier_id AND sr.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
        GROUP BY s.supplier_id, s.name, s.email, s.phone, s.rating, s.is_active
        ORDER BY s.rating DESC
      `;
      const suppliers = await databaseService.query(suppliersQuery);

      const topRatedQuery = `
        SELECT
          s.supplier_id, s.name, s.rating,
          COUNT(DISTINCT pmr.project_id) as projects_served
        FROM suppliers s
        LEFT JOIN project_material_requirements pmr ON s.supplier_id = pmr.supplier_id AND pmr.deleted_at IS NULL
        WHERE s.deleted_at IS NULL AND s.rating IS NOT NULL
        GROUP BY s.supplier_id, s.name, s.rating
        ORDER BY s.rating DESC, projects_served DESC
        LIMIT 10
      `;
      const topRatedSuppliers = await databaseService.query(topRatedQuery);

      const ratingDistributionQuery = `
        SELECT FLOOR(rating) as rating_level, COUNT(*) as count
        FROM suppliers
        WHERE deleted_at IS NULL AND rating IS NOT NULL
        GROUP BY FLOOR(rating)
        ORDER BY rating_level DESC
      `;
      const ratingDistribution = await databaseService.query(ratingDistributionQuery);

      return {
        stats: stats[0],
        suppliers,
        topRatedSuppliers,
        ratingDistribution,
      };
    } catch (error) {
      throw new Error(`Failed to generate supplier performance report: ${error.message}`);
    }
  }

  // F1: Monthly trend data for charts
  async getSupplierTrends() {
    try {
      const trendsQuery = `
        SELECT
          s.supplier_id, s.name,
          DATE_FORMAT(sr.created_at, '%Y-%m') AS month,
          ROUND(AVG(sr.rating), 2) AS avg_rating,
          COUNT(sr.supplier_rating_id) AS rating_count
        FROM suppliers s
        JOIN supplier_ratings sr ON s.supplier_id = sr.supplier_id AND sr.deleted_at IS NULL
        WHERE sr.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY s.supplier_id, s.name, month
        ORDER BY s.supplier_id, month ASC
      `;
      return await databaseService.query(trendsQuery);
    } catch (error) {
      throw new Error(`Failed to get supplier trends: ${error.message}`);
    }
  }

  // F3: In-depth analytics with schedule, quality, budget KPIs
  async getInDepthAnalytics(filters = {}) {
    try {
      const { startDate, endDate, projectId } = filters;

      let dateFilter = '';
      const params = [];

      if (startDate) {
        dateFilter += ' AND p.start_date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        dateFilter += ' AND p.end_date <= ?';
        params.push(endDate);
      }
      if (projectId) {
        dateFilter += ' AND p.project_id = ?';
        params.push(projectId);
      }

      const scheduleQuery = `
        SELECT
          p.project_id, p.name, p.start_date, p.end_date, p.actual_end_date,
          DATEDIFF(p.end_date, p.start_date) AS planned_duration,
          DATEDIFF(IFNULL(p.actual_end_date, CURDATE()), p.start_date) AS actual_duration,
          CASE WHEN p.actual_end_date IS NULL AND CURDATE() > p.end_date
            THEN DATEDIFF(CURDATE(), p.end_date) ELSE 0 END AS days_overdue,
          ROUND(
            DATEDIFF(p.end_date, p.start_date)
            / NULLIF(DATEDIFF(IFNULL(p.actual_end_date, CURDATE()), p.start_date), 0), 3
          ) AS spi,
          COUNT(DISTINCT pt.project_task_id) AS total_tasks,
          SUM(CASE WHEN pts.name = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
          ROUND(
            SUM(CASE WHEN pts.name = 'Completed' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(DISTINCT pt.project_task_id), 0) * 100, 2
          ) AS task_completion_rate
        FROM projects p
        LEFT JOIN project_tasks pt ON p.project_id = pt.project_id AND pt.deleted_at IS NULL
        LEFT JOIN project_task_statuses pts ON pt.project_task_status_id = pts.project_task_status_id
        WHERE p.deleted_at IS NULL ${dateFilter}
        GROUP BY p.project_id, p.name, p.start_date, p.end_date, p.actual_end_date
      `;

      const qualityParams = [];
      let qualityFilter = '';
      if (startDate) { qualityFilter += ' AND pmr.created_at >= ?'; qualityParams.push(startDate); }
      if (endDate) { qualityFilter += ' AND pmr.created_at <= ?'; qualityParams.push(endDate); }
      if (projectId) { qualityFilter += ' AND pmr.project_id = ?'; qualityParams.push(projectId); }

      const qualityQuery = `
        SELECT
          DATE_FORMAT(pmr.created_at, '%Y-%m') AS month,
          COUNT(pmr.project_material_requirement_id) AS deliveries,
          SUM(pmr.bad_quantity) AS total_defects,
          SUM(pmr.quantity) AS total_quantity,
          ROUND(SUM(pmr.bad_quantity) / NULLIF(SUM(pmr.quantity), 0) * 100, 2) AS defect_rate
        FROM project_material_requirements pmr
        WHERE pmr.deleted_at IS NULL ${qualityFilter}
        GROUP BY month ORDER BY month ASC
      `;

      const budgetQuery = `
        SELECT
          p.project_id, p.name, p.budget,
          COUNT(pmr.project_material_requirement_id) AS total_orders,
          SUM(pmr.good_quantity + pmr.bad_quantity) AS total_items_ordered
        FROM projects p
        LEFT JOIN project_material_requirements pmr ON p.project_id = pmr.project_id AND pmr.deleted_at IS NULL
        WHERE p.deleted_at IS NULL ${dateFilter}
        GROUP BY p.project_id, p.name, p.budget
      `;

      const [scheduleKPIs, qualityTrend, budgetKPIs] = await Promise.all([
        databaseService.query(scheduleQuery, params),
        databaseService.query(qualityQuery, qualityParams),
        databaseService.query(budgetQuery, params),
      ]);

      const validSpi = scheduleKPIs.filter((p) => p.spi !== null && isFinite(Number(p.spi)));
      const avg_spi =
        validSpi.length > 0
          ? parseFloat(
              (validSpi.reduce((s, p) => s + Number(p.spi), 0) / validSpi.length).toFixed(3)
            )
          : 0;

      const validComp = scheduleKPIs.filter((p) => p.task_completion_rate !== null);
      const avg_task_completion =
        validComp.length > 0
          ? parseFloat(
              (validComp.reduce((s, p) => s + Number(p.task_completion_rate), 0) / validComp.length).toFixed(2)
            )
          : 0;

      const validDefect = qualityTrend.filter((m) => m.defect_rate !== null);
      const avg_defect_rate =
        validDefect.length > 0
          ? parseFloat(
              (validDefect.reduce((s, m) => s + Number(m.defect_rate), 0) / validDefect.length).toFixed(2)
            )
          : 0;

      const total_active_projects = scheduleKPIs.length;
      const total_delayed_projects = scheduleKPIs.filter((p) => Number(p.days_overdue) > 0).length;

      const summary = { avg_spi, avg_task_completion, avg_defect_rate, total_active_projects, total_delayed_projects };

      return { scheduleKPIs, qualityTrend, budgetKPIs, summary, filters };
    } catch (error) {
      throw new Error(`Failed to get in-depth analytics: ${error.message}`);
    }
  }

  async getProjectSummary() {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_projects,
          SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_projects,
          SUM(CASE WHEN ps.name = 'Completed' THEN 1 ELSE 0 END) as completed_projects,
          SUM(CASE WHEN ps.name = 'On Hold' THEN 1 ELSE 0 END) as on_hold_projects,
          SUM(p.budget) as total_budget,
          AVG(p.budget) as average_budget
        FROM projects p
        LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
        WHERE p.deleted_at IS NULL
      `;
      const stats = await databaseService.query(statsQuery);

      const projectsQuery = `
        SELECT
          p.project_id, p.name, p.budget, p.start_date, p.end_date, p.actual_end_date, p.is_active,
          ps.name as status_name,
          CONCAT(u.first_name, ' ', u.last_name) as manager_name,
          (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project_id = p.project_id AND pt.deleted_at IS NULL) as total_tasks,
          (SELECT COUNT(*) FROM project_tasks pt
           LEFT JOIN project_task_statuses pts ON pt.project_task_status_id = pts.project_task_status_id
           WHERE pt.project_id = p.project_id AND pts.name = 'Completed' AND pt.deleted_at IS NULL) as completed_tasks
        FROM projects p
        LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
        LEFT JOIN users u ON p.project_manager = u.user_id
        WHERE p.deleted_at IS NULL
        ORDER BY p.project_id ASC
      `;
      const projects = await databaseService.query(projectsQuery);

      const projectsByStatusQuery = `
        SELECT ps.name as status_name, COUNT(*) as count
        FROM projects p
        LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
        WHERE p.deleted_at IS NULL
        GROUP BY ps.project_status_id, ps.name
        ORDER BY count DESC
      `;
      const projectsByStatus = await databaseService.query(projectsByStatusQuery);

      return { stats: stats[0], projects, projectsByStatus };
    } catch (error) {
      throw new Error(`Failed to generate project summary: ${error.message}`);
    }
  }

  async getMaterialUsage() {
    try {
      const statsQuery = `
        SELECT
          COUNT(DISTINCT m.material_id) as total_materials,
          COUNT(DISTINCT m.material_category_id) as total_categories,
          SUM(CASE WHEN m.is_active = 1 THEN 1 ELSE 0 END) as active_materials
        FROM materials m
        WHERE m.deleted_at IS NULL
      `;
      const stats = await databaseService.query(statsQuery);

      const mostUsedMaterialsQuery = `
        SELECT
          m.material_id, m.name as material_name, mc.name as category_name,
          COUNT(pmr.project_material_requirement_id) as usage_count,
          SUM(pmr.quantity) as total_quantity,
          SUM(pmr.good_quantity) as total_good_quantity,
          SUM(pmr.bad_quantity) as total_bad_quantity
        FROM materials m
        LEFT JOIN material_categories mc ON m.material_category_id = mc.material_category_id
        LEFT JOIN project_material_requirements pmr ON m.material_id = pmr.material_id AND pmr.deleted_at IS NULL
        WHERE m.deleted_at IS NULL
        GROUP BY m.material_id, m.name, mc.name
        ORDER BY usage_count DESC, total_quantity DESC
        LIMIT 20
      `;
      const mostUsedMaterials = await databaseService.query(mostUsedMaterialsQuery);

      const materialsByCategoryQuery = `
        SELECT
          mc.name as category_name,
          COUNT(m.material_id) as material_count,
          COUNT(DISTINCT pmr.project_id) as projects_using
        FROM material_categories mc
        LEFT JOIN materials m ON mc.material_category_id = m.material_category_id AND m.deleted_at IS NULL
        LEFT JOIN project_material_requirements pmr ON m.material_id = pmr.material_id AND pmr.deleted_at IS NULL
        WHERE mc.deleted_at IS NULL
        GROUP BY mc.material_category_id, mc.name
        ORDER BY material_count DESC
      `;
      const materialsByCategory = await databaseService.query(materialsByCategoryQuery);

      const materialsByProjectQuery = `
        SELECT
          p.project_id, p.name as project_name,
          COUNT(DISTINCT pmr.material_id) as materials_count,
          SUM(pmr.quantity) as total_quantity,
          SUM(pmr.good_quantity) as total_good_quantity,
          ROUND(SUM(pmr.good_quantity) / NULLIF(SUM(pmr.quantity), 0) * 100, 2) as fulfillment_rate
        FROM projects p
        LEFT JOIN project_material_requirements pmr ON p.project_id = pmr.project_id AND pmr.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
        GROUP BY p.project_id, p.name
        HAVING materials_count > 0
        ORDER BY materials_count DESC
        LIMIT 20
      `;
      const materialsByProject = await databaseService.query(materialsByProjectQuery);

      return { stats: stats[0], mostUsedMaterials, materialsByCategory, materialsByProject };
    } catch (error) {
      throw new Error(`Failed to generate material usage report: ${error.message}`);
    }
  }

  // F1: Generate PDF report using pdfkit
  async generatePdfReport(type) {
    return new Promise(async (resolve, reject) => {
      try {
        let data;
        switch (type) {
          case 'supplier-performance':
            data = await this.getSupplierPerformance();
            break;
          default:
            data = { message: 'No data available' };
        }

        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(`NovaSphere Report - ${type.replace(/-/g, ' ').toUpperCase()}`, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(2);

        if (type === 'supplier-performance' && data.stats) {
          // Summary section
          doc.fontSize(14).font('Helvetica-Bold').text('Summary');
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica');
          doc.text(`Total Suppliers: ${data.stats.total_suppliers}`);
          doc.text(`Active Suppliers: ${data.stats.active_suppliers}`);
          doc.text(`Average Rating: ${Number(data.stats.average_rating).toFixed(1)}`);
          doc.moveDown(1);

          // At-risk suppliers
          const atRisk = (data.suppliers || []).filter((s) => Number(s.is_at_risk) === 1);
          if (atRisk.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('At-Risk Suppliers');
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica');
            for (const s of atRisk) {
              doc.text(
                `• ${s.name} | Rating: ${s.rating || 'N/A'} | On-time: ${s.on_time_rate ?? 'N/A'}% | Defect: ${s.defect_rate ?? 'N/A'}%`
              );
            }
            doc.moveDown(1);
          }

          // Top performers
          const topPerformers = (data.suppliers || []).filter(
            (s) => Number(s.rating) >= 4.0 && Number(s.is_at_risk) === 0
          );
          if (topPerformers.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Top Performers (Rating ≥ 4.0)');
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica');
            for (const s of topPerformers) {
              doc.text(
                `• ${s.name} | Rating: ${s.rating} | Projects: ${s.projects_count}`
              );
            }
          }
        }

        doc.end();
      } catch (error) {
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    });
  }

  // F1 + existing: Generate export file (XLSX with multi-sheet for supplier-performance)
  async generateExportFile(type, format) {
    try {
      let data;
      switch (type) {
        case 'project-summary':
          data = await this.getProjectSummary();
          break;
        case 'material-usage':
          data = await this.getMaterialUsage();
          break;
        case 'supplier-performance':
          data = await this.getSupplierPerformance();
          break;
        case 'risk-analysis':
          data = await this.getDelayRisks();
          break;
        case 'quality-control':
          data = await this.getQualityIssues();
          break;
        default:
          data = { message: 'No data available for this report type' };
      }

      const safeStringify = (obj) =>
        JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'NovaSphere';
        workbook.created = new Date();

        if (type === 'supplier-performance' && Array.isArray(data.suppliers) && data.suppliers.length > 0) {
          return await this._buildSupplierPerformanceXlsx(workbook, data);
        }

        // Generic single-sheet export
        const arrayCandidates = [
          'projects', 'suppliers', 'mostUsedMaterials', 'qualityStats', 'materialsByProject',
          'materialsByCategory', 'delayedProjects', 'upcomingRisks', 'topRatedSuppliers', 'ratingDistribution', 'projectsByStatus',
        ];

        let rows = null;
        for (const k of arrayCandidates) {
          if (Array.isArray(data?.[k]) && data[k].length > 0) {
            rows = data[k];
            break;
          }
        }

        const sheetName = (type || 'Report').slice(0, 31);

        if (rows) {
          const ws = workbook.addWorksheet(sheetName);
          this._buildStyledSheet(ws, rows, type);
          const buffer = await workbook.xlsx.writeBuffer();
          return Buffer.from(buffer);
        }

        const fallbackHeadersByType = {
          'quality-control': ['material_id', 'material_name', 'supplier_name', 'total_delivered', 'total_defects', 'defect_rate', 'current_supplier_rating'],
          'material-usage': ['material_id', 'material_name', 'category_name', 'usage_count', 'total_quantity', 'total_good_quantity', 'total_bad_quantity'],
          'project-summary': ['project_id', 'name', 'budget', 'start_date', 'end_date', 'status_name', 'manager_name'],
          'supplier-performance': ['supplier_id', 'name', 'email', 'phone', 'rating', 'on_time_rate', 'defect_rate', 'is_at_risk'],
        };

        const headers = fallbackHeadersByType[type];
        if (headers && headers.length > 0) {
          const sheet = workbook.addWorksheet(sheetName);
          this._buildHeaderOnlySheet(sheet, headers, type);
          const buffer = await workbook.xlsx.writeBuffer();
          return Buffer.from(buffer);
        }

        const metaSheet = workbook.addWorksheet('Report');
        metaSheet.getCell(1, 1).value = 'Report Type';
        metaSheet.getCell(1, 2).value = type;
        metaSheet.getCell(2, 1).value = 'Generated At';
        metaSheet.getCell(2, 2).value = new Date().toISOString();
        metaSheet.getCell(3, 1).value = 'Payload';
        metaSheet.getCell(3, 2).value = safeStringify(data).slice(0, 10000);

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
      }

      throw new Error('Unsupported export format. Only XLSX/PDF is supported.');
    } catch (error) {
      throw new Error(`Failed to generate export file: ${error.message}`);
    }
  }

  async _buildSupplierPerformanceXlsx(workbook, data) {
    // Sheet 1: Overview
    const ws1 = workbook.addWorksheet('Overview');
    const overviewRows = data.suppliers.map((s) => ({
      supplier_id: s.supplier_id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      rating: s.rating,
      projects_count: s.projects_count,
      avg_detailed_rating: s.avg_detailed_rating,
      rating_count: s.rating_count,
      on_time_rate: s.on_time_rate,
      defect_rate: s.defect_rate,
      is_at_risk: s.is_at_risk,
    }));
    this._buildStyledSheet(ws1, overviewRows, 'supplier-performance');

    // Sheet 2: At-Risk Suppliers
    const atRisk = data.suppliers.filter((s) => Number(s.is_at_risk) === 1);
    const ws2 = workbook.addWorksheet('At-Risk Suppliers');
    if (atRisk.length > 0) {
      this._buildStyledSheet(ws2, atRisk, 'supplier-performance', { headerFill: 'FFCC0000' });
    } else {
      ws2.getCell(1, 1).value = 'No at-risk suppliers found.';
    }

    // Sheet 3: Monthly Trends
    const trends = await this.getSupplierTrends();
    const ws3 = workbook.addWorksheet('Monthly Trends');
    if (trends.length > 0) {
      this._buildStyledSheet(ws3, trends, 'monthly-trends');
    } else {
      ws3.getCell(1, 1).value = 'No rating trend data available.';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  _buildStyledSheet(ws, rows, type, options = {}) {
    if (!rows || rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const headerFill = options.headerFill || 'FF2C3E50';

    const colWidths = headers.map((h) => {
      let max = h.length;
      for (const r of rows) {
        const v = r[h];
        const len = v === null || v === undefined ? 0 : String(v).length;
        if (len > max) max = len;
      }
      return Math.min(Math.max(max + 4, 12), 60);
    });

    ws.mergeCells(1, 1, 1, headers.length);
    ws.getCell(1, 1).value = `NOVA SPHERE REPORT - ${type.replace(/-/g, ' ').toUpperCase()}`;
    ws.getCell(1, 1).font = { size: 14, bold: true, name: 'Segoe UI' };
    ws.getRow(2).getCell(1).value = `Generated at: ${new Date().toISOString()}`;
    ws.getRow(2).getCell(1).font = { name: 'Segoe UI', italic: true, size: 10 };

    const headerRowIndex = 4;
    ws.columns = headers.map((h, idx) => ({ header: h, key: h, width: colWidths[idx] }));

    const headerRow = ws.getRow(headerRowIndex);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIdx = headerRowIndex + 1;
    for (const r of rows) {
      const rowValues = headers.map((h) => {
        const v = r[h];
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        const keyLower = h.toLowerCase();
        if (keyLower.includes('date')) {
          const d = new Date(v);
          if (!isNaN(d)) return d;
        }
        return v;
      });

      const excelRow = ws.addRow(rowValues);

      if ((rowIdx - headerRowIndex) % 2 === 0) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        });
      }

      // Highlight at-risk row
      if (Number(r.is_at_risk) === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEEE' } };
        });
      }

      rowIdx++;
    }

    ws.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: headers.length },
    };
    ws.views = [{ state: 'frozen', ySplit: headerRowIndex, topLeftCell: `A${headerRowIndex + 1}` }];
  }

  _buildHeaderOnlySheet(sheet, headers, type) {
    sheet.mergeCells(1, 1, 1, headers.length);
    sheet.getCell(1, 1).value = `NOVA SPHERE REPORT - ${type.replace(/-/g, ' ').toUpperCase()}`;
    sheet.getCell(1, 1).font = { size: 14, bold: true, name: 'Segoe UI' };

    sheet.getRow(2).getCell(1).value = `Generated at: ${new Date().toISOString()}`;
    sheet.getRow(2).getCell(1).font = { name: 'Segoe UI', italic: true, size: 10 };

    const colWidths = headers.map((h) => Math.min(Math.max(h.length + 8, 12), 60));
    sheet.columns = headers.map((h, idx) => ({ header: h, key: h, width: colWidths[idx] }));

    const headerRowIndex = 4;
    const headerRow = sheet.getRow(headerRowIndex);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: headers.length },
    };
    sheet.views = [{ state: 'frozen', ySplit: headerRowIndex, topLeftCell: `A${headerRowIndex + 1}` }];
  }
}

export default new ReportService();
