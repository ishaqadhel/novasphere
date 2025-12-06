import databaseService from '../../../services/database/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ETLScript {
  constructor() {
    this.tsvBasePath = path.resolve(__dirname, './');
    this.adminUserId = 1;
    this.stats = {
      suppliersInserted: 0,
      suppliersSkipped: 0,
      materialsInserted: 0,
      materialsSkipped: 0,
      materialsFiltered: 0,
      categoriesCreated: 0,
      projectsCreated: 0,
      requirementsInserted: 0,
      requirementsSkipped: 0,
    };
  }

  async run() {
    console.log('==========================================');
    console.log('Starting ETL process...');
    console.log('==========================================');
    console.log(`TSV files location: ${this.tsvBasePath}\n`);

    try {
      await databaseService.connect();

      // Phase 1: Load material categories first
      await this.seedMaterialCategories();

      // Phase 2: Load companies → suppliers
      await this.loadSuppliers();

      // Phase 3: Load materials (excluding Day/Hour units)
      await this.loadMaterials();

      // Phase 4: Load transactions → projects & project_material_requirements
      await this.loadTransactionsAsProjects();

      console.log('\n==========================================');
      console.log('=== ETL Summary ===');
      console.log('==========================================');
      await this.printSummary();

      console.log('\n==========================================');
      console.log('ETL process completed successfully!');
      console.log('==========================================\n');
      process.exit(0);
    } catch (error) {
      console.error('\n==========================================');
      console.error('ETL failed:', error.message);
      console.error('==========================================');
      console.error(error.stack);
      process.exit(1);
    }
  }

  parseTSV(filePath) {
    console.log(`  → Parsing TSV file: ${path.basename(filePath)}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`TSV file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      throw new Error(`TSV file is empty: ${filePath}`);
    }

    // Extract headers from first line
    const headers = lines[0].split('\t').map((h) => h.trim());

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : null;
      });

      rows.push(row);
    }

    console.log(`  → Parsed ${rows.length} rows from ${path.basename(filePath)}`);
    return rows;
  }

  normalizeUnitName(unit) {
    if (!unit) return null;

    const normalized = unit.trim();

    // Case normalization rules
    if (normalized.toLowerCase() === 'piece') return 'Piece';
    if (normalized.toLowerCase() === 'one test') return 'One Test';

    return normalized;
  }

  categorizeMaterial(itemName) {
    if (!itemName) return 'Other';

    const item = itemName.toLowerCase();

    if (item.startsWith('product')) return 'Products';
    if (item.startsWith('equipment')) return 'Equipment';
    if (item.startsWith('machine')) return 'Machinery';
    if (item.startsWith('technician')) return 'Labor - Technical';
    if (item.includes('worker')) return 'Labor - General';
    if (item.includes('operator')) return 'Labor - Operations';

    return 'Other';
  }

  async seedMaterialCategories() {
    console.log('\n[0/4] Seeding material categories...');

    const categories = [
      'Products',
      'Equipment',
      'Machinery',
      'Labor - Technical',
      'Labor - General',
      'Labor - Operations',
      'Other',
    ];

    let created = 0;

    for (const categoryName of categories) {
      const existing = await databaseService.query(
        'SELECT material_category_id FROM material_categories WHERE name = ? AND deleted_at IS NULL',
        [categoryName]
      );

      if (existing.length === 0) {
        await databaseService.execute(
          'INSERT INTO material_categories (name, is_active) VALUES (?, ?)',
          [categoryName, true]
        );
        created++;
      }
    }

    this.stats.categoriesCreated = created;
    console.log(`  ✓ Material categories: ${created} created\n`);
  }

  async loadSuppliers() {
    console.log('[1/4] Loading suppliers from companies.tsv...');

    const tsvPath = path.join(this.tsvBasePath, 'companies.tsv');
    const companies = this.parseTSV(tsvPath);

    console.log('  → Processing suppliers...');

    for (const company of companies) {
      // Validate required fields
      if (!company.name || !company.email || !company.phone || !company.address) {
        this.stats.suppliersSkipped++;
        continue;
      }

      // Check if supplier already exists
      const existing = await databaseService.query(
        'SELECT supplier_id FROM suppliers WHERE name = ? AND deleted_at IS NULL',
        [company.name]
      );

      if (existing.length > 0) {
        this.stats.suppliersSkipped++;
        continue;
      }

      // Insert supplier
      await databaseService.execute(
        `INSERT INTO suppliers (name, email, phone, address, website, rating, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company.name.substring(0, 100),
          company.email.substring(0, 100),
          company.phone.substring(0, 20),
          company.address,
          null,
          null,
          true,
          this.adminUserId,
        ]
      );

      this.stats.suppliersInserted++;
    }

    console.log(
      `  ✓ Suppliers: ${this.stats.suppliersInserted} inserted, ${this.stats.suppliersSkipped} skipped\n`
    );
  }

  async loadMaterials() {
    console.log('[2/4] Loading materials from materials.tsv...');

    const tsvPath = path.join(this.tsvBasePath, 'materials.tsv');
    const materials = this.parseTSV(tsvPath);

    console.log('  → Processing materials (filtering out Day/Hour units)...');

    for (const material of materials) {
      // FILTER OUT Day and Hour units
      if (material.Unit === 'Day' || material.Unit === 'Hour') {
        this.stats.materialsFiltered++;
        continue;
      }

      // Validate required fields
      if (!material.Item) {
        this.stats.materialsSkipped++;
        continue;
      }

      // Get category ID
      const categoryName = this.categorizeMaterial(material.Item);
      const categoryResult = await databaseService.query(
        'SELECT material_category_id FROM material_categories WHERE name = ? AND deleted_at IS NULL',
        [categoryName]
      );

      if (categoryResult.length === 0) {
        console.warn(`    ⚠ Category not found: ${categoryName}`);
        this.stats.materialsSkipped++;
        continue;
      }

      const categoryId = categoryResult[0].material_category_id;

      // Check if material already exists
      const existing = await databaseService.query(
        'SELECT material_id FROM materials WHERE name = ? AND deleted_at IS NULL',
        [material.Item.substring(0, 100)]
      );

      if (existing.length > 0) {
        this.stats.materialsSkipped++;
        continue;
      }

      // Insert material
      await databaseService.execute(
        `INSERT INTO materials (name, material_category_id, is_active)
         VALUES (?, ?, ?)`,
        [material.Item.substring(0, 100), categoryId, true]
      );

      this.stats.materialsInserted++;
    }

    console.log(
      `  ✓ Materials: ${this.stats.materialsInserted} inserted, ${this.stats.materialsSkipped} skipped, ${this.stats.materialsFiltered} filtered (Day/Hour)\n`
    );
  }

  async loadTransactionsAsProjects() {
    console.log('[3/4] Loading transactions as projects and material requirements...');

    const tsvPath = path.join(this.tsvBasePath, 'transactions.tsv');
    const transactions = this.parseTSV(tsvPath);

    // Build lookup maps for existing companies and materials from TSV
    const companiesTsvPath = path.join(this.tsvBasePath, 'companies.tsv');
    const companiesTsv = this.parseTSV(companiesTsvPath);
    const companyNameMap = {};
    companiesTsv.forEach((company) => {
      if (company.company_id && company.name) {
        companyNameMap[company.company_id] = company.name;
      }
    });

    const materialsTsvPath = path.join(this.tsvBasePath, 'materials.tsv');
    const materialsTsv = this.parseTSV(materialsTsvPath);
    const materialItemMap = {};
    const materialUnitMap = {};
    materialsTsv.forEach((material) => {
      if (material.material_id && material.Item) {
        materialItemMap[material.material_id] = material.Item;
        materialUnitMap[material.material_id] = material.Unit;
      }
    });

    // Step 1: Create projects per year
    console.log('  → Creating projects by year...');
    const years = new Set();
    transactions.forEach((t) => {
      if (t.transaction_date) {
        const year = t.transaction_date.substring(0, 4);
        if (parseInt(year) >= 1900 && parseInt(year) <= 2100) {
          years.add(year);
        }
      }
    });

    const projectStatusResult = await databaseService.query(
      "SELECT project_status_id FROM project_statuses WHERE name = 'In Progress' AND deleted_at IS NULL LIMIT 1"
    );

    if (projectStatusResult.length === 0) {
      throw new Error("Project status 'In Progress' not found. Please run seed script first.");
    }

    const projectStatusId = projectStatusResult[0].project_status_id;
    const managerUserId = this.adminUserId;

    const yearToProjectMap = {};

    for (const year of Array.from(years).sort()) {
      const projectName = `Import Project ${year}`;

      // Check if project exists
      const existing = await databaseService.query(
        'SELECT project_id FROM projects WHERE name = ? AND deleted_at IS NULL',
        [projectName]
      );

      if (existing.length > 0) {
        yearToProjectMap[year] = existing[0].project_id;
        continue;
      }

      // Create project
      const result = await databaseService.execute(
        `INSERT INTO projects (name, description, budget, start_date, end_date, status, project_manager, is_active, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectName,
          `Auto-generated project from transaction imports for year ${year}`,
          1000000.0,
          `${year}-01-01`,
          `${year}-12-31`,
          projectStatusId,
          managerUserId,
          true,
          this.adminUserId,
          this.adminUserId,
        ]
      );

      yearToProjectMap[year] = result.insertId;
      this.stats.projectsCreated++;
    }

    console.log(`  ✓ Projects: ${this.stats.projectsCreated} created`);

    // Step 2: Load transactions as project_material_requirements
    console.log('  → Loading project material requirements...');

    const deliveredStatusResult = await databaseService.query(
      "SELECT project_material_requirement_status_id FROM project_material_requirement_statuses WHERE name = 'Delivered' AND deleted_at IS NULL LIMIT 1"
    );

    if (deliveredStatusResult.length === 0) {
      throw new Error(
        "Material requirement status 'Delivered' not found. Please run seed script first."
      );
    }

    const deliveredStatusId = deliveredStatusResult[0].project_material_requirement_status_id;

    let progressCounter = 0;

    for (const transaction of transactions) {
      // Validate required fields
      if (
        !transaction.transaction_date ||
        !transaction.company_id ||
        !transaction.material_id ||
        !transaction.quantity ||
        !transaction.price_per_unit ||
        !transaction.total_price
      ) {
        this.stats.requirementsSkipped++;
        continue;
      }

      const year = transaction.transaction_date.substring(0, 4);
      const projectId = yearToProjectMap[year];

      if (!projectId) {
        this.stats.requirementsSkipped++;
        continue;
      }

      // Map company_id to supplier_id by name
      const companyName = companyNameMap[transaction.company_id];
      if (!companyName) {
        this.stats.requirementsSkipped++;
        continue;
      }

      const supplierResult = await databaseService.query(
        'SELECT supplier_id FROM suppliers WHERE name = ? AND deleted_at IS NULL LIMIT 1',
        [companyName]
      );

      if (supplierResult.length === 0) {
        this.stats.requirementsSkipped++;
        continue;
      }

      const supplierId = supplierResult[0].supplier_id;

      // Map material_id to material by name
      const materialItem = materialItemMap[transaction.material_id];
      const materialUnit = materialUnitMap[transaction.material_id];

      if (!materialItem) {
        this.stats.requirementsSkipped++;
        continue;
      }

      // Skip if material was filtered out (Day/Hour)
      if (materialUnit === 'Day' || materialUnit === 'Hour') {
        this.stats.requirementsSkipped++;
        continue;
      }

      const materialResult = await databaseService.query(
        'SELECT material_id FROM materials WHERE name = ? AND deleted_at IS NULL LIMIT 1',
        [materialItem.substring(0, 100)]
      );

      if (materialResult.length === 0) {
        this.stats.requirementsSkipped++;
        continue;
      }

      const materialId = materialResult[0].material_id;

      // Get unit_id from normalized unit name
      let unitId = null;
      if (materialUnit) {
        const normalizedUnit = this.normalizeUnitName(materialUnit);
        const unitResult = await databaseService.query(
          'SELECT unit_id FROM project_material_requirement_units WHERE name = ? AND deleted_at IS NULL LIMIT 1',
          [normalizedUnit]
        );

        if (unitResult.length > 0) {
          unitId = unitResult[0].unit_id;
        }
      }

      // Insert project_material_requirement
      await databaseService.execute(
        `INSERT INTO project_material_requirements
         (project_id, material_id, supplier_id, quantity, unit_id, price, total_price,
          arrived_date, status, is_active, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          materialId,
          supplierId,
          parseInt(transaction.quantity),
          unitId,
          parseFloat(transaction.price_per_unit),
          parseFloat(transaction.total_price),
          transaction.transaction_date,
          deliveredStatusId,
          true,
          this.adminUserId,
          this.adminUserId,
        ]
      );

      this.stats.requirementsInserted++;
      progressCounter++;

      if (progressCounter % 5000 === 0) {
        console.log(`    → Progress: ${progressCounter} requirements inserted...`);
      }
    }

    console.log(
      `  ✓ Material Requirements: ${this.stats.requirementsInserted} inserted, ${this.stats.requirementsSkipped} skipped\n`
    );
  }

  async printSummary() {
    const tables = [
      { table: 'material_categories', label: 'Material Categories' },
      { table: 'suppliers', label: 'Suppliers' },
      { table: 'materials', label: 'Materials' },
      { table: 'project_material_requirement_units', label: 'Units' },
      { table: 'projects', label: 'Projects' },
      { table: 'project_material_requirements', label: 'Material Requirements' },
    ];

    for (const { table, label } of tables) {
      const result = await databaseService.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE deleted_at IS NULL`
      );
      console.log(`${label.padEnd(25)} : ${result[0].count} records`);
    }
  }
}

const etl = new ETLScript();
etl.run();
