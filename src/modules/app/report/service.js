import databaseService from '../../../services/database/index.js';

class ReportService {
  /**
   * Get project summary report
   * Includes: total projects, active projects, completed projects, budget analysis
   */
  async getProjectSummary() {
    try {
      // Get project statistics
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

      // Get project list with details
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
        ORDER BY p.project_id DESC
      `;
      const projects = await databaseService.query(projectsQuery);

      // Get projects by status
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

  /**
   * Get material usage report
   * Includes: most used materials, material by category, material requirements by project
   */
  async getMaterialUsage() {
    try {
      // Get material statistics
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT m.material_id) as total_materials,
          COUNT(DISTINCT m.material_category_id) as total_categories,
          SUM(CASE WHEN m.is_active = 1 THEN 1 ELSE 0 END) as active_materials
        FROM materials m
        WHERE m.deleted_at IS NULL
      `;
      const stats = await databaseService.query(statsQuery);

      // Get most used materials
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

      // Get materials by category
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

      // Get material requirements by project
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

  /**
   * Get supplier performance report
   * Includes: supplier ratings, delivery performance, active suppliers
   */
  async getSupplierPerformance() {
    try {
      // Get supplier statistics
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

      // Get supplier list with ratings
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

      // Get top rated suppliers
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

      // Get supplier distribution by rating
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
