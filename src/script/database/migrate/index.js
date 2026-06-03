import databaseService from '../../../services/database/index.js';

class MigrationScript {
  async run() {
    console.log('Starting database migration...');

    try {
      await databaseService.connect();

      // Drop tables if exists (in reverse order of dependencies)
      await this.dropTables();

      // Create tables
      await this.createRolesTable();
      await this.createUsersTable();
      await this.createModulesTable();
      await this.createNotificationsTable();
      await this.createSuppliersTable();
      await this.createProjectStatusesTable();
      await this.createProjectsTable();
      await this.createProjectMembersTable();
      await this.createProjectTaskStatusesTable();
      await this.createProjectTasksTable();
      await this.createMaterialCategoriesTable();
      await this.createMaterialsTable();
      await this.createProjectMaterialRequirementStatusesTable();
      await this.createProjectMaterialRequirementUnitsTable();
      await this.createProjectMaterialRequirementsTable();
      await this.createSupplierRatingsTable();
      await this.createPmrAlertLogsTable();
      // SRMA tables
      await this.createTaskDependenciesTable();
      await this.createRiskEventsTable();
      await this.createRiskEventTaskLinksTable();
      await this.createMitigationMeasuresTable();
      await this.createMitigationMeasureTaskLinksTable();
      await this.createSrmaRunsTable();
      await this.createSrmaRunMeasureCriticalityTable();
      await this.createSrmaRunActivityCriticalityTable();
      await this.createSrmaRunScurvePointTable();
      await this.createSrmaAlertLogsTable();

      console.log('Database migration completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  }

  async dropTables() {
    console.log('Dropping existing tables...');
    await databaseService.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'srma_alert_logs',
      'srma_run_scurve_point',
      'srma_run_activity_criticality',
      'srma_run_measure_criticality',
      'srma_runs',
      'mitigation_measure_task_links',
      'mitigation_measures',
      'risk_event_task_links',
      'risk_events',
      'task_dependencies',
      'pmr_alert_logs',
      'supplier_ratings',
      'project_material_requirements',
      'project_material_requirement_statuses',
      'project_material_requirement_units',
      'materials',
      'material_categories',
      'project_tasks',
      'project_task_statuses',
      'project_members',
      'projects',
      'project_statuses',
      'suppliers',
      'notifications',
      'modules',
      'users',
      'roles',
    ];

    for (const table of tables) {
      await databaseService.query(`DROP TABLE IF EXISTS ${table}`);
    }

    await databaseService.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  async createRolesTable() {
    console.log('Creating roles table...');
    await databaseService.query(`
      CREATE TABLE roles (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_roles_name (name),
        INDEX idx_roles_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createUsersTable() {
    console.log('Creating users table...');
    await databaseService.query(`
      CREATE TABLE users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        last_login_at TIMESTAMP NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        role_id INT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(role_id),
        INDEX idx_users_email (email),
        INDEX idx_users_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createModulesTable() {
    console.log('Creating modules table...');
    await databaseService.query(`
      CREATE TABLE modules (
        module_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        INDEX idx_modules_name (name),
        INDEX idx_modules_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createNotificationsTable() {
    console.log('Creating notifications table...');
    await databaseService.query(`
      CREATE TABLE notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        user_id INT NOT NULL,
        module_id INT,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (module_id) REFERENCES modules(module_id),
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_module_id (module_id),
        INDEX idx_notifications_is_read (is_read),
        INDEX idx_notifications_created_at (created_at),
        INDEX idx_notifications_user_is_read (user_id, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSuppliersTable() {
    console.log('Creating suppliers table...');
    await databaseService.query(`
      CREATE TABLE suppliers (
        supplier_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        website VARCHAR(255),
        rating DECIMAL(2,1),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        INDEX idx_suppliers_name (name),
        INDEX idx_suppliers_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectStatusesTable() {
    console.log('Creating project_statuses table...');
    await databaseService.query(`
      CREATE TABLE project_statuses (
        project_status_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_project_statuses_name (name),
        INDEX idx_project_statuses_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectsTable() {
    console.log('Creating projects table...');
    await databaseService.query(`
      CREATE TABLE projects (
        project_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        budget DECIMAL(15,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        actual_end_date DATE NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status INT NOT NULL,
        project_manager INT NOT NULL,
        daily_penalty_amount DECIMAL(15,2) NULL DEFAULT 0,
        daily_reward_amount DECIMAL(15,2) NULL DEFAULT 0,
        srma_last_run_at DATETIME NULL,
        srma_on_time_probability DECIMAL(5,4) NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (status) REFERENCES project_statuses(project_status_id),
        FOREIGN KEY (project_manager) REFERENCES users(user_id),
        INDEX idx_projects_project_manager (project_manager),
        INDEX idx_projects_status (status),
        INDEX idx_projects_start_date (start_date),
        INDEX idx_projects_end_date (end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectMembersTable() {
    console.log('Creating project_members table...');
    await databaseService.query(`
      CREATE TABLE project_members (
        project_member_id INT AUTO_INCREMENT PRIMARY KEY,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        UNIQUE KEY unique_project_user (project_id, user_id),
        INDEX idx_project_members_project_id (project_id),
        INDEX idx_project_members_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectTaskStatusesTable() {
    console.log('Creating project_task_statuses table...');
    await databaseService.query(`
      CREATE TABLE project_task_statuses (
        project_task_status_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_project_task_statuses_name (name),
        INDEX idx_project_task_statuses_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectTasksTable() {
    console.log('Creating project_tasks table...');
    await databaseService.query(`
      CREATE TABLE project_tasks (
        project_task_id INT AUTO_INCREMENT PRIMARY KEY,

        project_id INT NOT NULL,

        name VARCHAR(100) NOT NULL,
        description TEXT,

        project_task_status_id INT NOT NULL,
        assigned_to INT DEFAULT NULL,

        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        actual_end_date TIMESTAMP NULL DEFAULT NULL,

        duration_optimistic_days DECIMAL(6,2) NULL,
        duration_most_likely_days DECIMAL(6,2) NULL,
        duration_pessimistic_days DECIMAL(6,2) NULL,

        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,

        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (project_task_status_id) REFERENCES project_task_statuses(project_task_status_id),
        FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,

        INDEX idx_project_tasks_project_id (project_id),
        INDEX idx_project_tasks_name (name),
        INDEX idx_project_tasks_is_active (is_active),
        INDEX idx_project_tasks_status (project_task_status_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createMaterialCategoriesTable() {
    console.log('Creating material_categories table...');
    await databaseService.query(`
      CREATE TABLE material_categories (
        material_category_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_material_categories_name (name),
        INDEX idx_material_categories_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createMaterialsTable() {
    console.log('Creating materials table...');
    await databaseService.query(`
      CREATE TABLE materials (
        material_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        material_category_id INT NOT NULL,
        FOREIGN KEY (material_category_id) REFERENCES material_categories(material_category_id),
        INDEX idx_materials_name (name),
        INDEX idx_materials_is_active (is_active),
        INDEX idx_materials_material_category_id (material_category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectMaterialRequirementStatusesTable() {
    console.log('Creating project_material_requirement_statuses table...');
    await databaseService.query(`
      CREATE TABLE project_material_requirement_statuses (
        project_material_requirement_status_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_pmr_statuses_name (name),
        INDEX idx_pmr_statuses_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectMaterialRequirementUnitsTable() {
    console.log('Creating project_material_requirement_units table...');
    await databaseService.query(`
      CREATE TABLE project_material_requirement_units (
        unit_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_units_name (name),
        INDEX idx_units_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createProjectMaterialRequirementsTable() {
    console.log('Creating project_material_requirements table...');
    await databaseService.query(`
      CREATE TABLE project_material_requirements (
        project_material_requirement_id INT AUTO_INCREMENT PRIMARY KEY,

        quantity INT NOT NULL,
        unit_id INT,
        price DECIMAL(15,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,

        arrived_date DATE NOT NULL,
        actual_arrived_date DATE NULL,

        good_quantity INT DEFAULT 0,
        bad_quantity INT DEFAULT 0,

        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,

        project_id INT NOT NULL,
        material_id INT NOT NULL,
        supplier_id INT NOT NULL,
        status INT NOT NULL DEFAULT 1,

        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(material_id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
        FOREIGN KEY (status) REFERENCES project_material_requirement_statuses(project_material_requirement_status_id),
        FOREIGN KEY (unit_id) REFERENCES project_material_requirement_units(unit_id),

        INDEX idx_pmr_material_id (material_id),
        INDEX idx_pmr_is_active (is_active),
        INDEX idx_pmr_supplier_id (supplier_id),
        INDEX idx_pmr_status (status),
        INDEX idx_pmr_unit_id (unit_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSupplierRatingsTable() {
    console.log('Creating supplier_ratings table...');
    await databaseService.query(`
      CREATE TABLE supplier_ratings (
        supplier_rating_id INT AUTO_INCREMENT PRIMARY KEY,
        rating DECIMAL(2,1) NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        supplier_id INT NOT NULL,
        project_material_requirement_id INT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
        FOREIGN KEY (project_material_requirement_id) REFERENCES project_material_requirements(project_material_requirement_id),
        INDEX idx_supplier_ratings_supplier_id (supplier_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createPmrAlertLogsTable() {
    console.log('Creating pmr_alert_logs table...');
    await databaseService.query(`
      CREATE TABLE pmr_alert_logs (
        alert_log_id INT AUTO_INCREMENT PRIMARY KEY,
        project_material_requirement_id INT NOT NULL,
        user_id INT NOT NULL,
        alert_type VARCHAR(50) NOT NULL DEFAULT 'pre_delay_warning',
        alert_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_material_requirement_id) REFERENCES project_material_requirements(project_material_requirement_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        INDEX idx_alert_logs_pmr_id (project_material_requirement_id),
        INDEX idx_alert_logs_user_id (user_id),
        INDEX idx_alert_logs_alert_date (alert_date),
        UNIQUE KEY unique_daily_alert (project_material_requirement_id, user_id, alert_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  // --- SRMA Tables ---

  async createTaskDependenciesTable() {
    console.log('Creating task_dependencies table...');
    await databaseService.query(`
      CREATE TABLE task_dependencies (
        dependency_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        predecessor_task_id INT NOT NULL,
        successor_task_id INT NOT NULL,
        type ENUM('FS','SS','FF','SF') NOT NULL DEFAULT 'FS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        FOREIGN KEY (predecessor_task_id) REFERENCES project_tasks(project_task_id),
        FOREIGN KEY (successor_task_id) REFERENCES project_tasks(project_task_id),
        INDEX idx_task_dep_project (project_id),
        INDEX idx_task_dep_pred (predecessor_task_id),
        INDEX idx_task_dep_succ (successor_task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createRiskEventsTable() {
    console.log('Creating risk_events table...');
    await databaseService.query(`
      CREATE TABLE risk_events (
        risk_event_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        code VARCHAR(20) NOT NULL,
        description VARCHAR(255) NOT NULL,
        probability DECIMAL(5,4) NOT NULL DEFAULT 0.1,
        impact_optimistic_days DECIMAL(6,2) NOT NULL DEFAULT 0,
        impact_most_likely_days DECIMAL(6,2) NOT NULL DEFAULT 1,
        impact_pessimistic_days DECIMAL(6,2) NOT NULL DEFAULT 3,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        INDEX idx_risk_events_project (project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createRiskEventTaskLinksTable() {
    console.log('Creating risk_event_task_links table...');
    await databaseService.query(`
      CREATE TABLE risk_event_task_links (
        risk_event_id INT NOT NULL,
        project_task_id INT NOT NULL,
        PRIMARY KEY (risk_event_id, project_task_id),
        FOREIGN KEY (risk_event_id) REFERENCES risk_events(risk_event_id),
        FOREIGN KEY (project_task_id) REFERENCES project_tasks(project_task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createMitigationMeasuresTable() {
    console.log('Creating mitigation_measures table...');
    await databaseService.query(`
      CREATE TABLE mitigation_measures (
        mitigation_measure_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        code VARCHAR(20) NOT NULL,
        description VARCHAR(255) NOT NULL,
        capacity_optimistic_days DECIMAL(6,2) NOT NULL DEFAULT 0,
        capacity_most_likely_days DECIMAL(6,2) NOT NULL DEFAULT 1,
        capacity_pessimistic_days DECIMAL(6,2) NOT NULL DEFAULT 3,
        cost_min DECIMAL(15,2) NOT NULL DEFAULT 0,
        cost_most_likely DECIMAL(15,2) NOT NULL DEFAULT 1000,
        cost_max DECIMAL(15,2) NOT NULL DEFAULT 5000,
        dependency_factor DECIMAL(4,3) NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        INDEX idx_mitigation_project (project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createMitigationMeasureTaskLinksTable() {
    console.log('Creating mitigation_measure_task_links table...');
    await databaseService.query(`
      CREATE TABLE mitigation_measure_task_links (
        mitigation_measure_id INT NOT NULL,
        project_task_id INT NOT NULL,
        PRIMARY KEY (mitigation_measure_id, project_task_id),
        FOREIGN KEY (mitigation_measure_id) REFERENCES mitigation_measures(mitigation_measure_id),
        FOREIGN KEY (project_task_id) REFERENCES project_tasks(project_task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSrmaRunsTable() {
    console.log('Creating srma_runs table...');
    await databaseService.query(`
      CREATE TABLE srma_runs (
        srma_run_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        triggered_by_user_id INT NULL,
        started_at DATETIME NOT NULL,
        finished_at DATETIME NULL,
        n_iterations INT NOT NULL DEFAULT 5000,
        status ENUM('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
        on_time_probability DECIMAL(5,4) NULL,
        mean_net_cost DECIMAL(15,2) NULL,
        target_duration_days_at_run INT NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        INDEX idx_srma_runs_project (project_id),
        INDEX idx_srma_runs_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSrmaRunMeasureCriticalityTable() {
    console.log('Creating srma_run_measure_criticality table...');
    await databaseService.query(`
      CREATE TABLE srma_run_measure_criticality (
        srma_run_id INT NOT NULL,
        mitigation_measure_id INT NOT NULL,
        usage_frequency DECIMAL(5,4) NOT NULL DEFAULT 0,
        avg_cost_contribution DECIMAL(15,2) NOT NULL DEFAULT 0,
        PRIMARY KEY (srma_run_id, mitigation_measure_id),
        FOREIGN KEY (srma_run_id) REFERENCES srma_runs(srma_run_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSrmaRunActivityCriticalityTable() {
    console.log('Creating srma_run_activity_criticality table...');
    await databaseService.query(`
      CREATE TABLE srma_run_activity_criticality (
        srma_run_id INT NOT NULL,
        project_task_id INT NOT NULL,
        criticality_index DECIMAL(5,4) NOT NULL DEFAULT 0,
        PRIMARY KEY (srma_run_id, project_task_id),
        FOREIGN KEY (srma_run_id) REFERENCES srma_runs(srma_run_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSrmaRunScurvePointTable() {
    console.log('Creating srma_run_scurve_point table...');
    await databaseService.query(`
      CREATE TABLE srma_run_scurve_point (
        srma_run_id INT NOT NULL,
        duration_days INT NOT NULL,
        cumulative_probability DECIMAL(5,4) NOT NULL,
        PRIMARY KEY (srma_run_id, duration_days),
        FOREIGN KEY (srma_run_id) REFERENCES srma_runs(srma_run_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async createSrmaAlertLogsTable() {
    console.log('Creating srma_alert_logs table...');
    await databaseService.query(`
      CREATE TABLE srma_alert_logs (
        srma_alert_log_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        alert_type VARCHAR(50) NOT NULL DEFAULT 'probability_drop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        INDEX idx_srma_alert_project (project_id),
        INDEX idx_srma_alert_user (user_id),
        INDEX idx_srma_alert_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
}

const migration = new MigrationScript();
migration.run();
