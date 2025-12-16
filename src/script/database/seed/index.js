import databaseService from '../../../services/database/index.js';
import bcrypt from 'bcrypt';

class SeedScript {
  async run() {
    console.log('Starting database seeding...');

    try {
      await databaseService.connect();

      // 1. Seed Project Statuses (Level Project)
      await this.seedProjectStatuses();

      // 2. Seed Project Task Statuses (Level Task)
      await this.seedProjectTaskStatuses();

      // 3. Seed Project Material Requirement Statuses
      await this.seedProjectMaterialRequirementStatuses();

      // 4. Seed Project Material Requirement Units
      await this.seedProjectMaterialRequirementUnits();

      await this.seedRoles();
      await this.seedDefaultAdminUser();

      // 5. Seed Modules
      await this.seedModules();

      console.log('Database seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error.message);
      process.exit(1);
    }
  }

  async seedProjectStatuses() {
    console.log('Seeding project statuses...');
    const statuses = [
      { name: 'Planning' },
      { name: 'In Progress' },
      { name: 'Completed' },
      { name: 'On Hold' },
      { name: 'Cancelled' },
    ];

    for (const status of statuses) {
      const existing = await databaseService.query(
        'SELECT project_status_id FROM project_statuses WHERE name = ?',
        [status.name]
      );

      if (existing.length === 0) {
        await databaseService.execute(
          'INSERT INTO project_statuses (name, is_active) VALUES (?, ?)',
          [status.name, true]
        );
      }
    }
    console.log('Project statuses seeded.');
  }

  async seedProjectTaskStatuses() {
    console.log('Seeding project task statuses...');

    const taskStatuses = [
      { name: 'Planning' },
      { name: 'In Progress' },
      { name: 'Review' },
      { name: 'Completed' },
      { name: 'On Hold' },
      { name: 'Cancelled' },
    ];

    for (const status of taskStatuses) {
      const existing = await databaseService.query(
        'SELECT project_task_status_id FROM project_task_statuses WHERE name = ?',
        [status.name]
      );

      if (existing.length === 0) {
        await databaseService.execute(
          'INSERT INTO project_task_statuses (name, is_active) VALUES (?, ?)',
          [status.name, true]
        );
      }
    }

    console.log('Project task statuses seeded.');
  }

  async seedProjectMaterialRequirementStatuses() {
    console.log('Seeding project material requirement statuses...');

    const statuses = [
      { name: 'Pending' },
      { name: 'Approved' },
      { name: 'Ordered' },
      { name: 'Delivered' },
      { name: 'Rejected' },
    ];

    for (const status of statuses) {
      const existing = await databaseService.query(
        'SELECT project_material_requirement_status_id FROM project_material_requirement_statuses WHERE name = ?',
        [status.name]
      );

      if (existing.length === 0) {
        await databaseService.execute(
          'INSERT INTO project_material_requirement_statuses (name, is_active) VALUES (?, ?)',
          [status.name, true]
        );
      }
    }

    console.log('Project material requirement statuses seeded.');
  }

  async seedProjectMaterialRequirementUnits() {
    console.log('Seeding project material requirement units...');

    const units = [
      '900㎠',
      'Bag',
      'B.㎥',
      'C.㎥',
      'kg',
      'km',
      'L',
      'L.㎥',
      'm',
      'm²',
      '㎥',
      'Metric Ton',
      'One Test',
      'Pair',
      'Piece',
      'root',
      'Set',
      'Trip',
    ];

    for (const unitName of units) {
      const existing = await databaseService.query(
        'SELECT unit_id FROM project_material_requirement_units WHERE name = ?',
        [unitName]
      );

      if (existing.length === 0) {
        await databaseService.execute(
          'INSERT INTO project_material_requirement_units (name, is_active) VALUES (?, ?)',
          [unitName, true]
        );
      }
    }

    console.log('Project material requirement units seeded.');
  }
  // -----------------------------------------------

  async seedModules() {
    console.log('Seeding modules...');

    const modules = [
      { name: 'Dashboard', description: 'Main dashboard for overview and analytics' },
      { name: 'Material', description: 'Material management module' },
      { name: 'Material Category', description: 'Material category management module' },
      { name: 'Project', description: 'Project management module' },
      { name: 'Project Task', description: 'Project task management module' },
      {
        name: 'Project Material Requirement',
        description: 'Project material requirement management module',
      },
      { name: 'Supplier', description: 'Supplier management module' },
      { name: 'User', description: 'User management module' },
      { name: 'Report', description: 'Report generation and viewing module' },
    ];

    for (const module of modules) {
      const existing = await databaseService.query('SELECT module_id FROM modules WHERE name = ?', [
        module.name,
      ]);

      if (existing.length === 0) {
        await databaseService.execute(
          'INSERT INTO modules (name, description, is_active) VALUES (?, ?, ?)',
          [module.name, module.description, true]
        );
      }
    }

    console.log('Modules seeded.');
  }

  async seedRoles() {
    console.log('Seeding roles...');
    const roles = [{ name: 'admin' }, { name: 'pm' }, { name: 'supervisor' }];

    for (const role of roles) {
      const existing = await databaseService.query('SELECT role_id FROM roles WHERE name = ?', [
        role.name,
      ]);
      if (existing.length === 0) {
        await databaseService.execute('INSERT INTO roles (name, is_active) VALUES (?, ?)', [
          role.name,
          true,
        ]);
      }
    }
    console.log('Roles seeded.');
  }

  async seedDefaultAdminUser() {
    console.log('Seeding default users...');

    // Define users for each role
    const usersToSeed = [
      // Admin users
      {
        email: 'admin1@example.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'One',
        phone: '1234567890',
        roleName: 'admin',
      },
      {
        email: 'admin2@example.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'Two',
        phone: '1234567891',
        roleName: 'admin',
      },
      // PM users
      {
        email: 'pm1@example.com',
        password: 'password',
        firstName: 'Project Manager',
        lastName: 'One',
        phone: '2234567890',
        roleName: 'pm',
      },
      {
        email: 'pm2@example.com',
        password: 'password',
        firstName: 'Project Manager',
        lastName: 'Two',
        phone: '2234567891',
        roleName: 'pm',
      },
      // Supervisor users
      {
        email: 'supervisor1@example.com',
        password: 'password',
        firstName: 'Supervisor',
        lastName: 'One',
        phone: '3234567890',
        roleName: 'supervisor',
      },
      {
        email: 'supervisor2@example.com',
        password: 'password',
        firstName: 'Supervisor',
        lastName: 'Two',
        phone: '3234567891',
        roleName: 'supervisor',
      },
    ];

    // Get all roles
    const rolesData = await databaseService.query('SELECT role_id, name FROM roles');
    const roleMap = {};
    rolesData.forEach((role) => {
      roleMap[role.name] = role.role_id;
    });

    // Seed each user
    for (const user of usersToSeed) {
      const existingUser = await databaseService.query(
        'SELECT user_id FROM users WHERE email = ?',
        [user.email]
      );

      if (existingUser.length > 0) {
        console.log(`User ${user.email} already exists. Skipping.`);
        continue;
      }

      const roleId = roleMap[user.roleName];
      if (!roleId) {
        console.log(`Role ${user.roleName} not found. Skipping user ${user.email}.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

      await databaseService.execute(
        `INSERT INTO users (email, password, first_name, last_name, phone, role_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.email, hashedPassword, user.firstName, user.lastName, user.phone, roleId, true]
      );
      console.log(`User ${user.email} (${user.roleName}) created.`);
    }

    console.log('Default users seeded.');
  }
}

const seed = new SeedScript();
seed.run();
