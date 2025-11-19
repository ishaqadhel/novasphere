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
      await this.createProjectMaterialRequirementsTable();
      await this.createSupplierRatingsTable();

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
      'supplier_ratings',
      'project_material_requirements',
      'project_material_requirement_statuses',
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
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        actual_end_date TIMESTAMP NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status INT NOT NULL,
        project_manager INT NOT NULL,
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
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        actual_end_date TIMESTAMP NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status INT NOT NULL,
        assigned_to INT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (status) REFERENCES project_task_statuses(project_task_status_id),
        FOREIGN KEY (assigned_to) REFERENCES users(user_id),
        INDEX idx_project_tasks_name (name),
        INDEX idx_project_tasks_is_active (is_active),
        INDEX idx_project_tasks_status (status)
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

  async createProjectMaterialRequirementsTable() {
    console.log('Creating project_material_requirements table...');
    await databaseService.query(`
      CREATE TABLE project_material_requirements (
        project_material_requirement_id INT AUTO_INCREMENT PRIMARY KEY,
        quantity INT NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        arrived_date TIMESTAMP NOT NULL,
        actual_arrived_date TIMESTAMP NULL,
        good_quantity INT,
        bad_quantity INT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        project_id INT NOT NULL,
        material_id INT NOT NULL,
        supplier_id INT NOT NULL,
        status INT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id),
        FOREIGN KEY (material_id) REFERENCES materials(material_id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
        FOREIGN KEY (status) REFERENCES project_material_requirement_statuses(project_material_requirement_status_id),
        INDEX idx_pmr_material_id (material_id),
        INDEX idx_pmr_is_active (is_active),
        INDEX idx_pmr_supplier_id (supplier_id),
        INDEX idx_pmr_status (status)
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
}

const migration = new MigrationScript();
migration.run();
