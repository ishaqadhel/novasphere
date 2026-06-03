import { selectMitigations } from './optimizer.js';

function sampleBetaPert(opt, ml, pess) {
  const mean = (opt + 4 * ml + pess) / 6;
  const std = (pess - opt) / 6;
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(pess, Math.max(opt, mean + std * z));
}

function topoSort(activities) {
  const inDegree = new Map();
  const adjList = new Map();

  for (const act of activities) {
    inDegree.set(act.id, 0);
    adjList.set(act.id, []);
  }

  for (const act of activities) {
    for (const predId of act.predecessors) {
      if (adjList.has(predId)) {
        adjList.get(predId).push(act.id);
        inDegree.set(act.id, (inDegree.get(act.id) || 0) + 1);
      }
    }
  }

  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);
    for (const succ of adjList.get(node) || []) {
      const newDeg = inDegree.get(succ) - 1;
      inDegree.set(succ, newDeg);
      if (newDeg === 0) queue.push(succ);
    }
  }

  return sorted;
}

export function computeCPM(activities, durations) {
  if (!activities || activities.length === 0) {
    return { projectDuration: 0, criticalPath: new Set() };
  }

  const sorted = topoSort(activities);
  const ef = new Map();
  const es = new Map();

  for (const id of sorted) {
    const act = activities.find((a) => a.id === id);
    if (!act) continue;
    const maxPredEF = act.predecessors.reduce(
      (max, predId) => Math.max(max, ef.get(predId) || 0),
      0
    );
    es.set(id, maxPredEF);
    ef.set(id, maxPredEF + (durations.get(id) || 0));
  }

  const projectDuration = ef.size > 0 ? Math.max(...ef.values()) : 0;

  // Backward pass
  const lf = new Map();
  const ls = new Map();
  for (const id of sorted) lf.set(id, projectDuration);

  for (let i = sorted.length - 1; i >= 0; i--) {
    const id = sorted[i];
    const act = activities.find((a) => a.id === id);
    if (!act) continue;
    const dur = durations.get(id) || 0;
    ls.set(id, lf.get(id) - dur);

    for (const predId of act.predecessors) {
      if (lf.has(predId)) {
        lf.set(predId, Math.min(lf.get(predId), ls.get(id)));
      }
    }
  }

  const criticalPath = new Set();
  for (const id of sorted) {
    const slack = (lf.get(id) || 0) - (ef.get(id) || 0);
    if (Math.abs(slack) < 0.001) criticalPath.add(id);
  }

  return { projectDuration, criticalPath };
}

export function runSimulation(inputs, nIterations = 5000) {
  const { activities, risks, mitigations, targetDurationDays, dailyPenalty, dailyReward } = inputs;

  if (!activities || activities.length === 0) return [];

  const results = [];

  for (let i = 0; i < nIterations; i++) {
    // Sample base durations with PERT
    const durations = new Map();
    for (const act of activities) {
      durations.set(act.id, sampleBetaPert(act.durationOpt, act.durationML, act.durationPess));
    }

    // Apply risk events
    for (const risk of risks) {
      if (Math.random() < risk.probability) {
        const impact = sampleBetaPert(risk.impactOpt, risk.impactML, risk.impactPess);
        for (const taskId of risk.affectedTaskIds) {
          if (durations.has(taskId)) {
            durations.set(taskId, durations.get(taskId) + impact);
          }
        }
      }
    }

    // CPM forward/backward pass
    const { projectDuration: tCurr, criticalPath } = computeCPM(activities, durations);

    let measuresUsed = [];
    let totalMitigationCost = 0;
    let tNew = tCurr;

    if (tCurr > targetDurationDays && mitigations.length > 0) {
      const sampledCaps = new Map();
      const sampledCosts = new Map();
      for (const m of mitigations) {
        sampledCaps.set(m.id, sampleBetaPert(m.capOpt, m.capML, m.capPess));
        sampledCosts.set(m.id, sampleBetaPert(m.costMin, m.costML, m.costMax));
      }

      const result = selectMitigations(
        activities,
        mitigations,
        durations,
        tCurr,
        targetDurationDays,
        sampledCaps,
        sampledCosts
      );

      measuresUsed = result.selectedIds;
      totalMitigationCost = result.totalCost;

      // Recompute CPM with mitigations applied
      const durAfter = new Map(durations);
      for (const mitId of measuresUsed) {
        const mit = mitigations.find((m) => m.id === mitId);
        if (!mit) continue;
        const cap = sampledCaps.get(mitId) || 0;
        for (const taskId of mit.affectedTaskIds) {
          if (durAfter.has(taskId)) {
            durAfter.set(taskId, Math.max(0, durAfter.get(taskId) - cap));
          }
        }
      }

      const { projectDuration: tNewCalc } = computeCPM(activities, durAfter);
      tNew = tNewCalc;
    }

    const penalty = Math.max(0, tNew - targetDurationDays) * (dailyPenalty || 0);
    const reward = Math.max(0, targetDurationDays - tNew) * (dailyReward || 0);
    const netCost = totalMitigationCost + penalty - reward;

    results.push({ tNew, netCost, measuresUsed, criticalPath: [...criticalPath] });
  }

  return results;
}
