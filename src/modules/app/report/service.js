import databaseService from '../../../services/database/index.js';
import ExcelJS from 'exceljs';

class ReportService {
  /**
   * 1. Get Dashboard KPIs (Visualized reports & Trend lines)
   [cite_start]*[cite: 252]: 提供實時報告與視覺化分析工具
   */
  async getDashboardKPIs() {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM projects WHERE is_active = 1) as active_projects,
          (SELECT COUNT(*) FROM projects WHERE is_active = 1 AND end_date < CURDATE()) as delayed_projects,
          (SELECT COUNT(*) FROM suppliers WHERE is_active = 1) as active_suppliers,
          -- 移除: 因為資料表缺少 unit_price 欄位，暫時移除成本計算
          -- (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM project_material_requirements) as total_material_cost,
          
          -- 計算整體專案不良率 (Bad Quantity / Total Quantity)
          (SELECT ROUND(IFNULL(SUM(bad_quantity), 0) / IFNULL(SUM(quantity), 1) * 100, 2) 
           FROM project_material_requirements) as overall_defect_rate
      `;
      const result = await databaseService.query(query);
      return result[0];
    } catch (error) {
      throw new Error(`Failed to get dashboard KPIs: ${error.message}`);
    }
  }

  /**
   * 2. Get Delay Risks (Rule-based Pre-Delay Alerts)
   [cite_start]*[cite: 220, 286]: 針對即將到期或已延遲的項目發出警報
   */
  async getDelayRisks() {
    try {
      // 1. 找出已經延遲的專案 (Hard Delays)
      const delayedProjectsQuery = `
        SELECT 
          p.project_id, 
          p.name, 
          p.end_date, 
          DATEDIFF(CURDATE(), p.end_date) as days_overdue, 
          CONCAT(u.first_name, ' ', u.last_name) as manager_name
        FROM projects p
        LEFT JOIN users u ON p.project_manager = u.user_id
        WHERE p.is_active = 1 AND p.end_date < CURDATE()
        ORDER BY days_overdue DESC
      `;

      // 2. 找出即將到期 (例如：未來 7 天內截止) 的高風險專案
      const upcomingRisksQuery = `
        SELECT 
          p.project_id, 
          p.name, 
          p.end_date,
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

  /**
   * 3. Get Quality Control Report
   [cite_start]*[cite: 109, 277]: 針對不良品與退貨進行分析，減少重工成本
   */
  async getQualityIssues() {
    try {
      // 找出產生最多不良品的材料與供應商
      const qualityQuery = `
        SELECT 
          m.material_id,
          m.name as material_name,
          s.name as supplier_name,
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
      // Post-process stats to add template-friendly flags/classes
      const processed = stats.map((row) => {
        const defectRate = Number(row.defect_rate) || 0;
        const is_high_defect = defectRate > 5; // threshold 5%
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

  /**
   * 4. Generate Export File
   [cite_start]*[cite: 282]: 支援每週/每月報表生成 (PDF/CSV)
   */
  async generateExportFile(type, format) {
    try {
      // 根據 type 獲取對應數據
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
      // Safe stringify to handle BigInt from DB results
      const safeStringify = (obj) =>
        JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));

      // XLSX export implementation using exceljs
      if (format === 'xlsx') {
        // expanded list of possible array keys returned by various report getters
        const arrayCandidates = [
          'projects',
          'suppliers',
          'mostUsedMaterials',
          'qualityStats',
          'materialsByProject',
          'materialsByCategory',
          'delayedProjects',
          'upcomingRisks',
          'topRatedSuppliers',
          'ratingDistribution',
          'projectsByStatus',
        ];

        let rows = null;
        for (const k of arrayCandidates) {
          if (Array.isArray(data?.[k]) && data[k].length > 0) {
            rows = data[k];
            break;
          }
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'NovaSphere';
        workbook.created = new Date();
        const sheetName = (type || 'Report').slice(0, 31);

        // Build columns and rows if we have tabular data
        if (rows) {
          const ws = workbook.addWorksheet(sheetName);

          const headers = Object.keys(rows[0]);

          // Calculate column widths based on content
          const colWidths = headers.map((h) => {
            let max = String(h).length;
            for (const r of rows) {
              const v = r[h];
              const len = v === null || v === undefined ? 0 : String(v).length;
              if (len > max) max = len;
            }
            // add padding
            return Math.min(Math.max(max + 4, 12), 60);
          });

          // Meta header rows
          ws.mergeCells(1, 1, 1, headers.length);
          ws.getCell(1, 1).value = `NOVA SPHERE REPORT - ${type.replace(/-/g, ' ').toUpperCase()}`;
          ws.getCell(1, 1).font = { size: 14, bold: true, name: 'Segoe UI' };
          ws.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'left' };

          ws.getRow(2).getCell(1).value = `Generated at: ${new Date().toISOString()}`;
          ws.getRow(2).getCell(1).font = { name: 'Segoe UI', italic: true, size: 10 };
          ws.getRow(3).getCell(1).value = `Requested by: ${data.requestedBy || 'System'}`;
          ws.getRow(3).getCell(1).font = { name: 'Segoe UI', size: 10 };

          // leave a blank row, then header row at row 5
          const headerRowIndex = 5;

          ws.columns = headers.map((h, idx) => ({ header: h, key: h, width: colWidths[idx] }));

          // Style header row
          const headerRow = ws.getRow(headerRowIndex);
          headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { bottom: { style: 'thin' } };
          });

          // Insert data rows starting after headerRowIndex
          let rowIdx = headerRowIndex + 1;
          for (const r of rows) {
            const rowValues = headers.map((h) => {
              let v = r[h];
              if (v === null || v === undefined) return '';
              if (typeof v === 'object') return JSON.stringify(v);
              // format dates if header contains 'date'
              const keyLower = String(h).toLowerCase();
              if (keyLower.includes('date') && (typeof v === 'string' || typeof v === 'number')) {
                const d = new Date(v);
                if (!isNaN(d)) return d;
              }
              // percentages stored as numbers like 12.5 -> convert to fractional for excel
              if (
                (keyLower.includes('rate') ||
                  keyLower.includes('percent') ||
                  keyLower.includes('progress')) &&
                typeof v === 'number'
              ) {
                if (v > 1) return v / 100; // treat as percentage
                return v;
              }
              // numeric values: keep as is
              return v;
            });

            const excelRow = ws.addRow(rowValues);

            // Apply zebra striping and basic alignment/formatting per cell
            const isEven = (rowIdx - headerRowIndex) % 2 === 0;
            if (isEven) {
              excelRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
              });
            }

            // Per-column formatting
            headers.forEach((h, ci) => {
              const keyLower = String(h).toLowerCase();
              const cell = excelRow.getCell(ci + 1);
              // currency fields
              if (
                keyLower.includes('budget') ||
                keyLower.includes('amount') ||
                keyLower.includes('cost') ||
                keyLower.includes('price') ||
                keyLower.includes('total')
              ) {
                if (typeof cell.value === 'number') {
                  cell.numFmt = '"NT$"#,##0';
                  cell.alignment = { horizontal: 'right' };
                }
              }
              // dates
              else if (keyLower.includes('date')) {
                if (cell.value instanceof Date) {
                  cell.numFmt = 'yyyy-mm-dd';
                }
              }
              // percentages
              else if (
                keyLower.includes('rate') ||
                keyLower.includes('percent') ||
                keyLower.includes('progress')
              ) {
                if (typeof cell.value === 'number') {
                  cell.numFmt = '0.0%';
                  cell.alignment = { horizontal: 'right' };
                }
              }
              // ids and names
              else if (keyLower.includes('id')) {
                cell.alignment = { horizontal: 'left' };
              }
            });

            // Conditional highlighting: if this row was post-processed with an `is_high_defect` flag,
            // highlight the defect-related cell(s) to make issues stand out in Excel.
            try {
              if (r && r.is_high_defect) {
                headers.forEach((h, ci) => {
                  const keyLower = String(h).toLowerCase();
                  if (
                    keyLower.includes('defect') ||
                    keyLower.includes('defect_rate') ||
                    keyLower.includes('defect rate')
                  ) {
                    const cell = excelRow.getCell(ci + 1);
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'FFFFCCCC' },
                    };
                    cell.font = { color: { argb: 'FF9C0006' }, bold: true };
                  }
                });
              }
            } catch (e) {
              // non-fatal: if styling fails, continue without breaking the export
            }

            rowIdx++;
          }

          // Set autofilter and freeze header row
          ws.autoFilter = {
            from: { row: headerRowIndex, column: 1 },
            to: { row: headerRowIndex, column: headers.length },
          };
          // Use ExcelJS view properties for freezing panes: ySplit and topLeftCell
          ws.views = [
            { state: 'frozen', ySplit: headerRowIndex, topLeftCell: `A${headerRowIndex + 1}` },
          ];

          // Adjust print settings / footer
          ws.headerFooter.oddFooter = `&C&"Segoe UI,Regular"Page &P of &N - © NovaSphere`;

          // Return buffer
          const buffer = await workbook.xlsx.writeBuffer();
          return Buffer.from(buffer);
        }

        // If there is no tabular rows, produce a styled header-only sheet for known reports
        // so users download a consistent file (headers, colors, freeze panes) even when empty.
        const fallbackHeadersByType = {
          'quality-control': [
            'material_id',
            'material_name',
            'supplier_name',
            'total_delivered',
            'total_defects',
            'defect_rate',
            'current_supplier_rating',
          ],
          'material-usage': [
            'material_id',
            'material_name',
            'category_name',
            'usage_count',
            'total_quantity',
            'total_good_quantity',
            'total_bad_quantity',
          ],
          'project-summary': [
            'project_id',
            'name',
            'budget',
            'start_date',
            'end_date',
            'status_name',
            'manager_name',
          ],
          'supplier-performance': [
            'supplier_id',
            'name',
            'email',
            'phone',
            'rating',
            'projects_count',
            'avg_detailed_rating',
          ],
        };

        const headers = fallbackHeadersByType[type];
        if (headers && headers.length > 0) {
          const sheet = workbook.addWorksheet(type.slice(0, 31));

          // Meta header rows
          sheet.mergeCells(1, 1, 1, headers.length);
          sheet.getCell(1, 1).value =
            `NOVA SPHERE REPORT - ${type.replace(/-/g, ' ').toUpperCase()}`;
          sheet.getCell(1, 1).font = { size: 14, bold: true, name: 'Segoe UI' };
          sheet.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'left' };

          sheet.getRow(2).getCell(1).value = `Generated at: ${new Date().toISOString()}`;
          sheet.getRow(2).getCell(1).font = { name: 'Segoe UI', italic: true, size: 10 };
          sheet.getRow(3).getCell(1).value = `Requested by: ${data.requestedBy || 'System'}`;
          sheet.getRow(3).getCell(1).font = { name: 'Segoe UI', size: 10 };

          // leave a blank row, then header row at row 5
          const headerRowIndex = 5;

          // Estimate column widths
          const colWidths = headers.map((h) => Math.min(Math.max(h.length + 8, 12), 60));
          sheet.columns = headers.map((h, idx) => ({ header: h, key: h, width: colWidths[idx] }));

          // Add a small explanatory note (row 4) about conditional formatting when applicable
          if (type === 'quality-control') {
            sheet.getRow(4).getCell(1).value =
              'Note: defect_rate > 5% will be highlighted in red when data rows exist.';
            sheet.getRow(4).getCell(1).font = { italic: true, size: 10, name: 'Segoe UI' };
          }

          // Style header row
          const headerRow = sheet.getRow(headerRowIndex);
          headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { bottom: { style: 'thin' } };
          });

          // Set autofilter and freeze header row
          sheet.autoFilter = {
            from: { row: headerRowIndex, column: 1 },
            to: { row: headerRowIndex, column: headers.length },
          };
          sheet.views = [
            { state: 'frozen', ySplit: headerRowIndex, topLeftCell: `A${headerRowIndex + 1}` },
          ];

          // Footer
          sheet.headerFooter.oddFooter = `&C&"Segoe UI,Regular"Page &P of &N - © NovaSphere`;

          const buffer = await workbook.xlsx.writeBuffer();
          return Buffer.from(buffer);
        }

        // Default fallback: simple key-value sheet when no structured header mapping available
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

      throw new Error('Unsupported export format. Only XLSX is supported.');
    } catch (error) {
      throw new Error(`Failed to generate export file: ${error.message}`);
    }
  }

  // --- 以下保留您原本寫得很好的基礎方法 (維持不變) ---

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
          p.project_id,
          p.name,
          p.budget,
          p.start_date,
          p.end_date,
          p.actual_end_date,
          p.is_active,
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
        ORDER BY p.project_id ASC -- 已修改：依照 ID 由小到大排序
      `;
      const projects = await databaseService.query(projectsQuery);

      const projectsByStatusQuery = `
        SELECT 
          ps.name as status_name,
          COUNT(*) as count
        FROM projects p
        LEFT JOIN project_statuses ps ON p.status = ps.project_status_id
        WHERE p.deleted_at IS NULL
        GROUP BY ps.project_status_id, ps.name
        ORDER BY count DESC
      `;
      const projectsByStatus = await databaseService.query(projectsByStatusQuery);

      return {
        stats: stats[0],
        projects,
        projectsByStatus,
      };
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
          m.material_id,
          m.name as material_name,
          mc.name as category_name,
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
          p.project_id,
          p.name as project_name,
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

      return {
        stats: stats[0],
        mostUsedMaterials,
        materialsByCategory,
        materialsByProject,
      };
    } catch (error) {
      throw new Error(`Failed to generate material usage report: ${error.message}`);
    }
  }

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
          s.supplier_id,
          s.name,
          s.email,
          s.phone,
          s.rating,
          s.is_active,
          COUNT(DISTINCT pmr.project_id) as projects_count,
          AVG(sr.rating) as avg_detailed_rating,
          COUNT(sr.supplier_rating_id) as rating_count
        FROM suppliers s
        LEFT JOIN project_material_requirements pmr ON s.supplier_id = pmr.supplier_id AND pmr.deleted_at IS NULL
        LEFT JOIN supplier_ratings sr ON s.supplier_id = sr.supplier_id AND sr.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
        GROUP BY s.supplier_id, s.name, s.email, s.phone, s.rating, s.is_active
        ORDER BY s.rating DESC, avg_detailed_rating DESC
      `;
      const suppliers = await databaseService.query(suppliersQuery);

      const topRatedQuery = `
        SELECT 
          s.supplier_id,
          s.name,
          s.rating,
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
        SELECT 
          FLOOR(rating) as rating_level,
          COUNT(*) as count
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
}

export default new ReportService();
