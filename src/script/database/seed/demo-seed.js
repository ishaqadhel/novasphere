/**
 * SRMA Demo Seed
 *
 * Creates 3 projects with realistic task networks, risk events, and mitigations
 * for demonstrating the SRMA predictive delay simulation:
 *
 * Project 1: "Harbor Bridge Rehabilitation"   → HIGH RISK   (~30% on-time)
 * Project 2: "Tech Park Office Fit-Out"        → LOW RISK    (~90% on-time)
 * Project 3: "Coastal Highway Expansion"       → MODERATE    (~55% on-time)
 *
 * Run: npm run seed:demo
 */

import databaseService from '../../../services/database/index.js';

// Reference date: today
const NOW = new Date();
const d = (offsetDays) => {
  const dt = new Date(NOW);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
};

// ── helpers ──────────────────────────────────────────────────────────────────

async function getIds() {
  const [pmUser] = await databaseService.query(
    `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.name = 'pm' LIMIT 1`
  );
  const [adminUser] = await databaseService.query(
    `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.name = 'admin' LIMIT 1`
  );
  const [inProgressStatus] = await databaseService.query(
    `SELECT project_status_id id FROM project_statuses WHERE name = 'In Progress'`
  );
  const [taskStatuses] = await databaseService.query(
    `SELECT project_task_status_id id, name FROM project_task_statuses`
  );
  const taskStatusMap = {};
  const allStatuses = await databaseService.query(
    `SELECT project_task_status_id id, name FROM project_task_statuses`
  );
  for (const s of allStatuses) taskStatusMap[s.name] = s.id;

  const suppliers = await databaseService.query(
    `SELECT supplier_id FROM suppliers LIMIT 20`
  );
  const materials = await databaseService.query(
    `SELECT material_id FROM materials LIMIT 20`
  );
  const [deliveredStatus] = await databaseService.query(
    `SELECT project_material_requirement_status_id id FROM project_material_requirement_statuses WHERE name = 'Delivered'`
  );
  const [kgUnit] = await databaseService.query(
    `SELECT unit_id id FROM project_material_requirement_units WHERE name = 'kg' LIMIT 1`
  );

  return {
    pmId: pmUser.user_id,
    adminId: adminUser.user_id,
    projectStatusInProgress: inProgressStatus.id,
    taskStatusMap,
    suppliers: suppliers.map((s) => s.supplier_id),
    materials: materials.map((m) => m.material_id),
    deliveredStatusId: deliveredStatus.id,
    unitId: kgUnit ? kgUnit.id : null,
  };
}

async function createProject(data, ids) {
  const result = await databaseService.execute(
    `INSERT INTO projects
     (name, description, budget, start_date, end_date, is_active, status, project_manager,
      daily_penalty_amount, daily_reward_amount, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.description, data.budget,
      data.startDate, data.endDate,
      ids.projectStatusInProgress, ids.pmId,
      data.dailyPenalty || 0, data.dailyReward || 0,
      ids.adminId, ids.adminId,
    ]
  );
  return result.insertId;
}

async function createTask(projectId, data, statusId, adminId) {
  const result = await databaseService.execute(
    `INSERT INTO project_tasks
     (project_id, name, description, project_task_status_id, start_date, end_date,
      duration_optimistic_days, duration_most_likely_days, duration_pessimistic_days,
      is_active, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      projectId, data.name, data.desc || data.name,
      statusId,
      data.startDate, data.endDate,
      data.opt, data.ml, data.pess,
      adminId, adminId,
    ]
  );
  return result.insertId;
}

async function createDep(projectId, predId, succId) {
  await databaseService.execute(
    `INSERT INTO task_dependencies (project_id, predecessor_task_id, successor_task_id, type)
     VALUES (?, ?, ?, 'FS')`,
    [projectId, predId, succId]
  );
}

async function createRisk(projectId, data, taskIds) {
  const result = await databaseService.execute(
    `INSERT INTO risk_events
     (project_id, code, description, probability,
      impact_optimistic_days, impact_most_likely_days, impact_pessimistic_days, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [projectId, data.code, data.desc, data.prob, data.impOpt, data.impML, data.impPess]
  );
  const riskId = result.insertId;
  for (const tid of taskIds) {
    await databaseService.execute(
      `INSERT INTO risk_event_task_links (risk_event_id, project_task_id) VALUES (?, ?)`,
      [riskId, tid]
    );
  }
  return riskId;
}

async function createMitigation(projectId, data, taskIds) {
  const result = await databaseService.execute(
    `INSERT INTO mitigation_measures
     (project_id, code, description,
      capacity_optimistic_days, capacity_most_likely_days, capacity_pessimistic_days,
      cost_min, cost_most_likely, cost_max, dependency_factor, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      projectId, data.code, data.desc,
      data.capOpt, data.capML, data.capPess,
      data.costMin, data.costML, data.costMax,
      data.depFactor || 0,
    ]
  );
  const mitId = result.insertId;
  for (const tid of taskIds) {
    await databaseService.execute(
      `INSERT INTO mitigation_measure_task_links (mitigation_measure_id, project_task_id) VALUES (?, ?)`,
      [mitId, tid]
    );
  }
  return mitId;
}

async function createPmr(projectId, supplierId, materialId, data, ids) {
  await databaseService.execute(
    `INSERT INTO project_material_requirements
     (project_id, material_id, supplier_id, quantity, unit_id, price, total_price,
      arrived_date, actual_arrived_date, good_quantity, bad_quantity, status, is_active, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      projectId, materialId, supplierId,
      data.quantity, ids.unitId,
      data.price, data.quantity * data.price,
      data.arrivedDate, data.actualArrivedDate,
      data.goodQty, data.badQty,
      ids.deliveredStatusId,
      ids.adminId, ids.adminId,
    ]
  );
}

// ── PROJECT 1: Harbor Bridge Rehabilitation (HIGH RISK) ───────────────────────

async function seedProject1(ids) {
  console.log('\n[1/3] Harbor Bridge Rehabilitation — HIGH RISK (~30% on-time)');

  const projectId = await createProject({
    name: 'Harbor Bridge Rehabilitation',
    description: 'Structural rehabilitation of the main harbor bridge including steel framework, concrete deck, and safety systems.',
    budget: 48000000,
    startDate: d(-40),      // started 40 days ago
    endDate: d(20),         // deadline in 20 days → 60-day project
    dailyPenalty: 150000,   // NT$150k/day late
    dailyReward: 50000,
  }, ids);

  const S = ids.taskStatusMap;

  // ── Tasks ──────────────────────────────────────────────────────────────────
  // Tight critical path: E(total) ≈ 56 days vs 60-day target → ~30% on-time
  const t1 = await createTask(projectId, {
    name: 'Site Preparation & Mobilization',
    startDate: d(-40), endDate: d(-35),
    opt: 3, ml: 5, pess: 9,
  }, S['Completed'], ids.adminId);

  const t2 = await createTask(projectId, {
    name: 'Structural Assessment & Foundation Inspection',
    startDate: d(-36), endDate: d(-28),
    opt: 5, ml: 8, pess: 14,
  }, S['Completed'], ids.adminId);

  const t3 = await createTask(projectId, {
    name: 'Steel Framework Removal & Replacement',
    startDate: d(-28), endDate: d(-10),
    opt: 12, ml: 18, pess: 28,
  }, S['In Progress'], ids.adminId);

  const t4 = await createTask(projectId, {
    name: 'Formwork Installation',
    startDate: d(-11), endDate: d(-4),
    opt: 4, ml: 7, pess: 12,
  }, S['Planning'], ids.adminId);

  const t5 = await createTask(projectId, {
    name: 'Concrete Pouring — Main Deck',
    startDate: d(-4), endDate: d(5),
    opt: 6, ml: 9, pess: 16,
  }, S['Planning'], ids.adminId);

  const t6 = await createTask(projectId, {
    name: 'Concrete Curing & Strength Testing',
    startDate: d(5), endDate: d(12),
    opt: 5, ml: 7, pess: 11,
  }, S['Planning'], ids.adminId);

  const t7 = await createTask(projectId, {
    name: 'Waterproofing & Surface Treatment',
    startDate: d(12), endDate: d(17),
    opt: 3, ml: 5, pess: 9,
  }, S['Planning'], ids.adminId);

  const t8 = await createTask(projectId, {
    name: 'Guardrail & Safety Barrier Installation',
    startDate: d(-12), endDate: d(-3),
    opt: 4, ml: 7, pess: 11,
  }, S['In Progress'], ids.adminId);  // runs parallel with t3→t4

  const t9 = await createTask(projectId, {
    name: 'Lighting & Signage Installation',
    startDate: d(12), endDate: d(16),
    opt: 2, ml: 4, pess: 7,
  }, S['Planning'], ids.adminId);

  const t10 = await createTask(projectId, {
    name: 'Load Testing & Regulatory Inspection',
    startDate: d(17), endDate: d(21),
    opt: 2, ml: 4, pess: 8,
  }, S['Planning'], ids.adminId);

  // ── Dependencies ──────────────────────────────────────────────────────────
  // Main critical chain: t1→t2→t3→t4→t5→t6→t7→t10
  await createDep(projectId, t1, t2);
  await createDep(projectId, t2, t3);
  await createDep(projectId, t3, t4);
  await createDep(projectId, t3, t8);  // parallel safety work
  await createDep(projectId, t4, t5);
  await createDep(projectId, t5, t6);
  await createDep(projectId, t6, t7);
  await createDep(projectId, t7, t9);
  await createDep(projectId, t7, t10);
  await createDep(projectId, t8, t10);
  await createDep(projectId, t9, t10);

  // ── Risk Events ───────────────────────────────────────────────────────────
  await createRisk(projectId, {
    code: 'R-BR-01', desc: 'Steel Material Delivery Delay',
    prob: 0.45, impOpt: 3, impML: 7, impPess: 14,
  }, [t3]);

  await createRisk(projectId, {
    code: 'R-BR-02', desc: 'Typhoon / Severe Weather Disruption',
    prob: 0.35, impOpt: 2, impML: 5, impPess: 12,
  }, [t5, t6, t7]);

  await createRisk(projectId, {
    code: 'R-BR-03', desc: 'Concrete Mix Quality Failure — Retest Required',
    prob: 0.30, impOpt: 2, impML: 4, impPess: 9,
  }, [t5, t6]);

  await createRisk(projectId, {
    code: 'R-BR-04', desc: 'Regulatory Inspection Bottleneck',
    prob: 0.40, impOpt: 3, impML: 6, impPess: 15,
  }, [t10]);

  await createRisk(projectId, {
    code: 'R-BR-05', desc: 'Crane Equipment Breakdown',
    prob: 0.25, impOpt: 1, impML: 4, impPess: 10,
  }, [t3, t4]);

  // ── Mitigations ───────────────────────────────────────────────────────────
  await createMitigation(projectId, {
    code: 'M-BR-01', desc: 'Expedite Steel Supplier with Air Freight',
    capOpt: 3, capML: 6, capPess: 10,
    costMin: 120000, costML: 250000, costMax: 450000,
  }, [t3]);

  await createMitigation(projectId, {
    code: 'M-BR-02', desc: 'Deploy Night Shift Crew for Concrete Work',
    capOpt: 2, capML: 4, capPess: 7,
    costMin: 80000, costML: 150000, costMax: 280000,
  }, [t5, t6]);

  await createMitigation(projectId, {
    code: 'M-BR-03', desc: 'Pre-position Temporary Weather Enclosure',
    capOpt: 1, capML: 3, capPess: 6,
    costMin: 30000, costML: 70000, costMax: 140000,
  }, [t5, t7]);

  await createMitigation(projectId, {
    code: 'M-BR-04', desc: 'Hire Third-party Inspection Agency to Expedite Approval',
    capOpt: 2, capML: 4, capPess: 8,
    costMin: 50000, costML: 100000, costMax: 200000,
  }, [t10]);

  // ── PMRs with delays (for auto-risk seeding) ──────────────────────────────
  const sup = ids.suppliers;
  const mat = ids.materials;

  // Supplier 1 — consistently late
  for (let i = 0; i < 5; i++) {
    const planned = d(-38 + i * 5);
    const actual = d(-38 + i * 5 + 4 + Math.floor(Math.random() * 5)); // 4-8 days late
    await createPmr(projectId, sup[0], mat[0], {
      quantity: 500, price: 1200,
      arrivedDate: planned, actualArrivedDate: actual,
      goodQty: 480, badQty: 20,
    }, ids);
  }

  // Supplier 2 — sometimes late
  for (let i = 0; i < 4; i++) {
    const planned = d(-35 + i * 6);
    const late = i % 2 === 0; // every other order is late
    const actual = late ? d(-35 + i * 6 + 3) : d(-35 + i * 6);
    await createPmr(projectId, sup[1], mat[1], {
      quantity: 200, price: 3500,
      arrivedDate: planned, actualArrivedDate: actual,
      goodQty: 195, badQty: 5,
    }, ids);
  }

  // Supplier 3 — on time but high defects
  for (let i = 0; i < 3; i++) {
    const planned = d(-30 + i * 8);
    await createPmr(projectId, sup[2], mat[2], {
      quantity: 300, price: 800,
      arrivedDate: planned, actualArrivedDate: planned,
      goodQty: 210, badQty: 90, // 30% defect rate
    }, ids);
  }

  console.log(`  ✓ Project "${await getProjectName(projectId)}" created with 10 tasks, 5 risks, 4 mitigations, 12 PMRs`);
  return projectId;
}

// ── PROJECT 2: Tech Park Office Fit-Out (LOW RISK) ────────────────────────────

async function seedProject2(ids) {
  console.log('\n[2/3] Tech Park Office Fit-Out — LOW RISK (~90% on-time)');

  const projectId = await createProject({
    name: 'Tech Park Office Fit-Out',
    description: 'Complete interior fit-out of 3 floors in the new tech park including partitioning, MEP, IT infrastructure, and finishing.',
    budget: 22000000,
    startDate: d(-25),     // started 25 days ago
    endDate: d(65),        // 90-day project — plenty of slack
    dailyPenalty: 50000,
    dailyReward: 20000,
  }, ids);

  const S = ids.taskStatusMap;

  const t1 = await createTask(projectId, {
    name: 'Space Planning, Design & BIM Modeling',
    startDate: d(-25), endDate: d(-17),
    opt: 5, ml: 7, pess: 11,
  }, S['Completed'], ids.adminId);

  const t2 = await createTask(projectId, {
    name: 'Material & Equipment Procurement',
    startDate: d(-18), endDate: d(-7),
    opt: 7, ml: 10, pess: 14,
  }, S['Completed'], ids.adminId);

  const t3 = await createTask(projectId, {
    name: 'Demolition & Steel Partitioning',
    startDate: d(-8), endDate: d(6),
    opt: 9, ml: 13, pess: 17,
  }, S['In Progress'], ids.adminId);

  const t4 = await createTask(projectId, {
    name: 'Electrical Wiring & Distribution Boards',
    startDate: d(5), endDate: d(20),
    opt: 10, ml: 14, pess: 18,
  }, S['Planning'], ids.adminId);

  const t5 = await createTask(projectId, {
    name: 'Plumbing & Drainage',
    startDate: d(5), endDate: d(14),
    opt: 5, ml: 8, pess: 12,
  }, S['Planning'], ids.adminId);  // parallel with t4

  const t6 = await createTask(projectId, {
    name: 'HVAC & Ventilation System',
    startDate: d(5), endDate: d(16),
    opt: 7, ml: 10, pess: 14,
  }, S['Planning'], ids.adminId);  // parallel with t4, t5

  const t7 = await createTask(projectId, {
    name: 'False Ceiling & Raised Floor Installation',
    startDate: d(20), endDate: d(32),
    opt: 8, ml: 11, pess: 15,
  }, S['Planning'], ids.adminId);

  const t8 = await createTask(projectId, {
    name: 'Flooring, Painting & Interior Finishing',
    startDate: d(32), endDate: d(43),
    opt: 8, ml: 11, pess: 15,
  }, S['Planning'], ids.adminId);

  const t9 = await createTask(projectId, {
    name: 'IT Infrastructure & Server Room Setup',
    startDate: d(20), endDate: d(33),
    opt: 8, ml: 12, pess: 17,
  }, S['Planning'], ids.adminId);  // parallel with t7

  const t10 = await createTask(projectId, {
    name: 'Furniture & Fixture Installation',
    startDate: d(43), endDate: d(55),
    opt: 7, ml: 10, pess: 14,
  }, S['Planning'], ids.adminId);

  const t11 = await createTask(projectId, {
    name: 'AV Systems, Access Control & Security',
    startDate: d(43), endDate: d(53),
    opt: 6, ml: 9, pess: 13,
  }, S['Planning'], ids.adminId);  // parallel with t10

  const t12 = await createTask(projectId, {
    name: 'Final Inspection, Commissioning & Handover',
    startDate: d(55), endDate: d(62),
    opt: 3, ml: 5, pess: 8,
  }, S['Planning'], ids.adminId);

  // Dependencies
  await createDep(projectId, t1, t2);
  await createDep(projectId, t2, t3);
  await createDep(projectId, t3, t4);
  await createDep(projectId, t3, t5);
  await createDep(projectId, t3, t6);
  await createDep(projectId, t4, t7);
  await createDep(projectId, t5, t7);
  await createDep(projectId, t6, t7);
  await createDep(projectId, t4, t9);
  await createDep(projectId, t7, t8);
  await createDep(projectId, t8, t10);
  await createDep(projectId, t9, t10);
  await createDep(projectId, t9, t11);
  await createDep(projectId, t10, t12);
  await createDep(projectId, t11, t12);

  // Risk Events — mild, low probability
  await createRisk(projectId, {
    code: 'R-OF-01', desc: 'Material Delivery Minor Delay',
    prob: 0.15, impOpt: 1, impML: 2, impPess: 5,
  }, [t2]);

  await createRisk(projectId, {
    code: 'R-OF-02', desc: 'Client Design Change Request',
    prob: 0.20, impOpt: 1, impML: 3, impPess: 7,
  }, [t3, t7]);

  await createRisk(projectId, {
    code: 'R-OF-03', desc: 'IT Equipment Import Delay (customs)',
    prob: 0.12, impOpt: 2, impML: 4, impPess: 8,
  }, [t9]);

  // Mitigations — strong capacity
  await createMitigation(projectId, {
    code: 'M-OF-01', desc: 'Pre-approved Alternative Local Supplier',
    capOpt: 3, capML: 6, capPess: 9,
    costMin: 15000, costML: 35000, costMax: 70000,
  }, [t2]);

  await createMitigation(projectId, {
    code: 'M-OF-02', desc: 'Design Freeze Agreement & Change-Order Buffer',
    capOpt: 4, capML: 7, capPess: 10,
    costMin: 10000, costML: 25000, costMax: 55000,
  }, [t3, t7]);

  await createMitigation(projectId, {
    code: 'M-OF-03', desc: 'Temporary IT Equipment Lease During Customs Delay',
    capOpt: 3, capML: 5, capPess: 8,
    costMin: 20000, costML: 45000, costMax: 90000,
  }, [t9]);

  // PMRs — mostly on time, low defects
  const sup = ids.suppliers;
  const mat = ids.materials;

  for (let i = 0; i < 5; i++) {
    const planned = d(-22 + i * 4);
    const onTime = i < 4; // last order 1 day late
    await createPmr(projectId, sup[3], mat[3], {
      quantity: 400, price: 900,
      arrivedDate: planned,
      actualArrivedDate: onTime ? planned : d(-22 + i * 4 + 1),
      goodQty: 398, badQty: 2,
    }, ids);
  }

  for (let i = 0; i < 4; i++) {
    const planned = d(-20 + i * 5);
    await createPmr(projectId, sup[4], mat[4], {
      quantity: 150, price: 4200,
      arrivedDate: planned, actualArrivedDate: planned,
      goodQty: 150, badQty: 0,
    }, ids);
  }

  console.log(`  ✓ Project "${await getProjectName(projectId)}" created with 12 tasks, 3 risks, 3 mitigations, 9 PMRs`);
  return projectId;
}

// ── PROJECT 3: Coastal Highway Expansion (MODERATE RISK) ─────────────────────

async function seedProject3(ids) {
  console.log('\n[3/3] Coastal Highway Expansion — MODERATE RISK (~55% on-time)');

  const projectId = await createProject({
    name: 'Coastal Highway Expansion',
    description: 'Widening of 8km coastal highway section, including retaining walls, drainage, and new road surface.',
    budget: 85000000,
    startDate: d(-15),     // started 15 days ago
    endDate: d(40),        // 55-day project — some margin
    dailyPenalty: 200000,
    dailyReward: 80000,
  }, ids);

  const S = ids.taskStatusMap;

  const t1 = await createTask(projectId, {
    name: 'Topographic Survey & Geotechnical Investigation',
    startDate: d(-15), endDate: d(-9),
    opt: 4, ml: 6, pess: 10,
  }, S['Completed'], ids.adminId);

  const t2 = await createTask(projectId, {
    name: 'Utility Relocation (Power, Telecom, Water)',
    startDate: d(-10), endDate: d(0),
    opt: 7, ml: 11, pess: 18,
  }, S['In Progress'], ids.adminId);

  const t3 = await createTask(projectId, {
    name: 'Earthwork & Site Grading',
    startDate: d(-5), endDate: d(8),
    opt: 8, ml: 12, pess: 18,
  }, S['In Progress'], ids.adminId);  // overlaps t2

  const t4 = await createTask(projectId, {
    name: 'Retaining Wall Construction',
    startDate: d(8), endDate: d(22),
    opt: 10, ml: 14, pess: 22,
  }, S['Planning'], ids.adminId);

  const t5 = await createTask(projectId, {
    name: 'Drainage System Installation',
    startDate: d(8), endDate: d(18),
    opt: 6, ml: 9, pess: 14,
  }, S['Planning'], ids.adminId);  // parallel with t4

  const t6 = await createTask(projectId, {
    name: 'Sub-base & Base Course Paving',
    startDate: d(22), endDate: d(30),
    opt: 5, ml: 8, pess: 13,
  }, S['Planning'], ids.adminId);

  const t7 = await createTask(projectId, {
    name: 'Asphalt Surface Course',
    startDate: d(30), endDate: d(36),
    opt: 4, ml: 6, pess: 10,
  }, S['Planning'], ids.adminId);

  const t8 = await createTask(projectId, {
    name: 'Road Markings & Guardrails',
    startDate: d(36), endDate: d(40),
    opt: 2, ml: 3, pess: 6,
  }, S['Planning'], ids.adminId);

  const t9 = await createTask(projectId, {
    name: 'Street Lighting Installation',
    startDate: d(25), endDate: d(33),
    opt: 4, ml: 6, pess: 10,
  }, S['Planning'], ids.adminId);  // parallel with t6, t7

  const t10 = await createTask(projectId, {
    name: 'Traffic Management Signage & Safety Audit',
    startDate: d(38), endDate: d(42),
    opt: 2, ml: 3, pess: 5,
  }, S['Planning'], ids.adminId);

  // Dependencies
  await createDep(projectId, t1, t2);
  await createDep(projectId, t1, t3);
  await createDep(projectId, t2, t4);
  await createDep(projectId, t3, t4);
  await createDep(projectId, t3, t5);
  await createDep(projectId, t4, t6);
  await createDep(projectId, t5, t6);
  await createDep(projectId, t6, t7);
  await createDep(projectId, t6, t9);
  await createDep(projectId, t7, t8);
  await createDep(projectId, t8, t10);
  await createDep(projectId, t9, t10);

  // Risk Events — moderate probability/impact
  await createRisk(projectId, {
    code: 'R-HW-01', desc: 'Utility Relocation Scope Expansion (unexpected underground infrastructure)',
    prob: 0.38, impOpt: 3, impML: 7, impPess: 15,
  }, [t2]);

  await createRisk(projectId, {
    code: 'R-HW-02', desc: 'Rainy Season Earthwork Disruption',
    prob: 0.45, impOpt: 2, impML: 5, impPess: 11,
  }, [t3, t4]);

  await createRisk(projectId, {
    code: 'R-HW-03', desc: 'Asphalt Plant Supply Shortage',
    prob: 0.28, impOpt: 2, impML: 4, impPess: 9,
  }, [t6, t7]);

  await createRisk(projectId, {
    code: 'R-HW-04', desc: 'Environmental Compliance Hold (protected species survey)',
    prob: 0.22, impOpt: 3, impML: 8, impPess: 18,
  }, [t3]);

  // Mitigations — moderate
  await createMitigation(projectId, {
    code: 'M-HW-01', desc: 'Ground Penetrating Radar Pre-scan to Identify Utilities',
    capOpt: 3, capML: 6, capPess: 10,
    costMin: 40000, costML: 80000, costMax: 150000,
  }, [t2]);

  await createMitigation(projectId, {
    code: 'M-HW-02', desc: 'Deploy Extra Excavators & Dewatering Pumps',
    capOpt: 2, capML: 4, capPess: 7,
    costMin: 60000, costML: 120000, costMax: 220000,
  }, [t3, t4]);

  await createMitigation(projectId, {
    code: 'M-HW-03', desc: 'Pre-order Asphalt Stock & Lock-in Alternative Plant',
    capOpt: 2, capML: 3, capPess: 6,
    costMin: 25000, costML: 55000, costMax: 110000,
  }, [t6, t7]);

  // PMRs — mixed performance
  const sup = ids.suppliers;
  const mat = ids.materials;

  const delays = [0, 5, 0, 8, 0, 3, 0, 6, 0]; // alternating on-time and late
  for (let i = 0; i < 9; i++) {
    const planned = d(-13 + i * 5);
    const actualOffset = delays[i];
    await createPmr(projectId, sup[5 + (i % 5)], mat[5 + (i % 5)], {
      quantity: 600, price: 1500,
      arrivedDate: planned,
      actualArrivedDate: d(-13 + i * 5 + actualOffset),
      goodQty: actualOffset > 0 ? 570 : 600,
      badQty: actualOffset > 0 ? 30 : 0,
    }, ids);
  }

  console.log(`  ✓ Project "${await getProjectName(projectId)}" created with 10 tasks, 4 risks, 3 mitigations, 9 PMRs`);
  return projectId;
}

async function getProjectName(id) {
  const rows = await databaseService.query('SELECT name FROM projects WHERE project_id = ?', [id]);
  return rows[0]?.name || id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('==========================================');
  console.log('SRMA Demo Seed');
  console.log('==========================================');

  try {
    await databaseService.connect();

    // Skip if demo projects already exist
    const existing = await databaseService.query(
      `SELECT project_id FROM projects WHERE name IN (
        'Harbor Bridge Rehabilitation',
        'Tech Park Office Fit-Out',
        'Coastal Highway Expansion'
       ) LIMIT 1`
    );
    if (existing.length > 0) {
      console.log('Demo projects already exist. Skipping.');
      process.exit(0);
    }

    const ids = await getIds();

    const p1 = await seedProject1(ids);
    const p2 = await seedProject2(ids);
    const p3 = await seedProject3(ids);

    console.log('\n==========================================');
    console.log('Demo seed completed successfully!');
    console.log('==========================================');
    console.log(`\nProjects created: ${p1}, ${p2}, ${p3}`);
    console.log('\nExpected SRMA results after running simulation:');
    console.log('  Harbor Bridge Rehabilitation  → ~25-40% on-time  (HIGH RISK)');
    console.log('  Tech Park Office Fit-Out       → ~85-95% on-time  (LOW RISK)');
    console.log('  Coastal Highway Expansion      → ~50-65% on-time  (MODERATE)');
    console.log('\nRun: POST /app/report/predictive-delay/run with each project ID');

    process.exit(0);
  } catch (error) {
    console.error('\nDemo seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();
