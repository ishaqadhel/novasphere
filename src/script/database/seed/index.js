import databaseService from '../../../services/database/index.js';
import bcrypt from 'bcrypt';

class SeedScript {
  async run() {
    console.log('Starting database seeding...');

    try {
      await databaseService.connect();

      await this.seedRoles();
      await this.seedDefaultAdminUser();

      console.log('Database seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error.message);
      process.exit(1);
    }
  }

  async seedRoles() {
    console.log('Seeding roles...');

    const roles = [{ name: 'admin' }, { name: 'pm' }, { name: 'supervisor' }];

    for (const role of roles) {
      await databaseService.execute('INSERT INTO roles (name, is_active) VALUES (?, ?)', [
        role.name,
        true,
      ]);
    }

    console.log('Roles seeded: admin, pm, supervisor');
  }

  async seedDefaultAdminUser() {
    console.log('Seeding default admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Get admin role_id
    const roles = await databaseService.query('SELECT role_id FROM roles WHERE name = ?', [
      'admin',
    ]);
    const adminRoleId = roles[0].role_id;

    await databaseService.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin@example.com', hashedPassword, 'Admin', 'User', '1234567890', adminRoleId, true]
    );

    console.log('Default admin user created:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
  }
}

const seed = new SeedScript();
seed.run();
