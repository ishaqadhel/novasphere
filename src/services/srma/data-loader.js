import databaseService from '../database/index.js';

export async function loadSrmaInputs(projectId) {
  const [project] = await databaseService.query(
    `SELECT project_id, name, start_date, end_date, daily_penalty_amount, daily_reward_amount
     FROM projects WHERE project_id = ? AND deleted_at IS NULL`,
    [projectId]
  );

  if (!project) throw new Error(`Project ${projectId} not found`);

  const targetDurationDays =
    Math.max(
      1,
      Math.round(
        (new Date(project.end_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24)
      )
    );

  // Load tasks with PERT fallback
  const tasks = await databaseService.query(
    `SELECT project_task_id, name,
            duration_optimistic_days, duration_most_likely_days, duration_pessimistic_days,
            start_date, end_date
     FROM project_tasks
     WHERE project_id = ? AND deleted_at IS NULL`,
    [projectId]
  );

  const activities = tasks.map((t) => {
    const mlFallback = Math.max(
      1,
      Math.round(
        (new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60 * 24)
      )
    );
    const ml = Number(t.duration_most_likely_days) || mlFallback;
    const opt = Number(t.duration_optimistic_days) || Math.max(0.5, ml * 0.85);
    const pess = Number(t.duration_pessimistic_days) || ml * 1.25;
    return {
      id: t.project_task_id,
      name: t.name,
      durationOpt: opt,
      durationML: ml,
      durationPess: pess,
      predecessors: [],
    };
  });

  // Load task dependencies
  const deps = await databaseService.query(
    `SELECT predecessor_task_id, successor_task_id FROM task_dependencies
     WHERE project_id = ? AND deleted_at IS NULL AND type = 'FS'`,
    [projectId]
  );

  const actMap = new Map(activities.map((a) => [a.id, a]));
  for (const dep of deps) {
    const succ = actMap.get(dep.successor_task_id);
    if (succ) succ.predecessors.push(dep.predecessor_task_id);
  }

  // Load risk events from DB
  const riskRows = await databaseService.query(
    `SELECT re.risk_event_id, re.probability,
            re.impact_optimistic_days, re.impact_most_likely_days, re.impact_pessimistic_days,
            GROUP_CONCAT(retl.project_task_id) as task_ids
     FROM risk_events re
     LEFT JOIN risk_event_task_links retl ON re.risk_event_id = retl.risk_event_id
     WHERE re.project_id = ? AND re.is_active = 1 AND re.deleted_at IS NULL
     GROUP BY re.risk_event_id`,
    [projectId]
  );

  const risks = riskRows.map((r) => ({
    id: r.risk_event_id,
    probability: Number(r.probability),
    impactOpt: Number(r.impact_optimistic_days),
    impactML: Number(r.impact_most_likely_days),
    impactPess: Number(r.impact_pessimistic_days),
    affectedTaskIds: r.task_ids
      ? r.task_ids.split(',').map(Number).filter((id) => actMap.has(id))
      : activities.map((a) => a.id),
  }));

  // Auto-seed risk events from PMR data if no explicit risks defined
  if (risks.length === 0 && activities.length > 0) {
    const supplierRisks = await databaseService.query(
      `SELECT s.supplier_id, s.name as supplier_name,
              COUNT(pmr.project_material_requirement_id) as total_count,
              SUM(CASE WHEN pmr.actual_arrived_date > pmr.arrived_date THEN 1 ELSE 0 END) as late_count,
              AVG(CASE WHEN pmr.actual_arrived_date > pmr.arrived_date
                  THEN DATEDIFF(pmr.actual_arrived_date, pmr.arrived_date) ELSE 0 END) as avg_delay_days
       FROM suppliers s
       JOIN project_material_requirements pmr ON s.supplier_id = pmr.supplier_id
       WHERE pmr.project_id = ? AND pmr.deleted_at IS NULL AND pmr.actual_arrived_date IS NOT NULL
       GROUP BY s.supplier_id, s.name
       HAVING total_count > 0`,
      [projectId]
    );

    for (const sr of supplierRisks) {
      const prob = Math.min(0.95, sr.late_count / sr.total_count);
      const avgDelay = Number(sr.avg_delay_days) || 1;
      if (prob > 0.05) {
        risks.push({
          id: `auto_${sr.supplier_id}`,
          probability: parseFloat(prob.toFixed(4)),
          impactOpt: 0,
          impactML: avgDelay,
          impactPess: avgDelay * 2,
          affectedTaskIds: activities.map((a) => a.id),
        });
      }
    }
  }

  // Load mitigations
  const mitigationRows = await databaseService.query(
    `SELECT mm.mitigation_measure_id, mm.description,
            mm.capacity_optimistic_days, mm.capacity_most_likely_days, mm.capacity_pessimistic_days,
            mm.cost_min, mm.cost_most_likely, mm.cost_max,
            GROUP_CONCAT(mmtl.project_task_id) as task_ids
     FROM mitigation_measures mm
     LEFT JOIN mitigation_measure_task_links mmtl ON mm.mitigation_measure_id = mmtl.mitigation_measure_id
     WHERE mm.project_id = ? AND mm.is_active = 1 AND mm.deleted_at IS NULL
     GROUP BY mm.mitigation_measure_id`,
    [projectId]
  );

  const mitigations = mitigationRows.map((m) => ({
    id: m.mitigation_measure_id,
    description: m.description,
    capOpt: Number(m.capacity_optimistic_days),
    capML: Number(m.capacity_most_likely_days),
    capPess: Number(m.capacity_pessimistic_days),
    costMin: Number(m.cost_min),
    costML: Number(m.cost_most_likely),
    costMax: Number(m.cost_max),
    affectedTaskIds: m.task_ids
      ? m.task_ids.split(',').map(Number).filter((id) => actMap.has(id))
      : activities.map((a) => a.id),
  }));

  return {
    activities,
    risks,
    mitigations,
    targetDurationDays,
    dailyPenalty: Number(project.daily_penalty_amount) || 0,
    dailyReward: Number(project.daily_reward_amount) || 0,
    project,
  };
}
