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
    console.log('Seeding default admin user...');
    const existingUser = await databaseService.query('SELECT user_id FROM users WHERE email = ?', [
      'admin@example.com',
    ]);
    if (existingUser.length > 0) {
      console.log('Default admin user already exists. Skipping.');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const roles = await databaseService.query('SELECT role_id FROM roles WHERE name = ?', [
      'admin',
    ]);

    if (roles.length === 0) {
      throw new Error('Admin role not found. Seed roles failed?');
    }

    const adminRoleId = roles[0].role_id;

    await databaseService.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin@example.com', hashedPassword, 'Admin', 'User', '1234567890', adminRoleId, true]
    );
    console.log('Default admin user created.');
  }
}

const seed = new SeedScript();
seed.run();
