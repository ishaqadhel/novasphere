function topoSortInternal(activities) {
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

function computeProjectDuration(activities, durations) {
  if (!activities || activities.length === 0) return 0;

  const sorted = topoSortInternal(activities);
  const ef = new Map();

  for (const id of sorted) {
    const act = activities.find((a) => a.id === id);
    if (!act) continue;
    const maxPredEF = act.predecessors.reduce(
      (max, predId) => Math.max(max, ef.get(predId) || 0),
      0
    );
    ef.set(id, maxPredEF + (durations.get(id) || 0));
  }

  return ef.size > 0 ? Math.max(...ef.values()) : 0;
}

export function selectMitigations(
  activities,
  mitigations,
  currentDurations,
  tCurr,
  target,
  sampledCaps,
  sampledCosts
) {
  if (tCurr <= target) {
    return { selectedIds: [], totalCost: 0, tNew: tCurr };
  }

  // Sort by time-saved per cost ratio descending
  const scored = mitigations.map((m) => {
    const cap = sampledCaps.get(m.id) || 0;
    const cost = Math.max(1, sampledCosts.get(m.id) || 1);
    return { id: m.id, cap, cost, ratio: cap / cost, affectedTaskIds: m.affectedTaskIds };
  });

  scored.sort((a, b) => b.ratio - a.ratio);

  const selectedIds = [];
  let totalCost = 0;
  const workingDurations = new Map(currentDurations);

  for (const m of scored) {
    if (m.cap <= 0) continue;

    for (const taskId of m.affectedTaskIds) {
      if (workingDurations.has(taskId)) {
        workingDurations.set(taskId, Math.max(0, workingDurations.get(taskId) - m.cap));
      }
    }

    selectedIds.push(m.id);
    totalCost += m.cost;

    const duration = computeProjectDuration(activities, workingDurations);
    if (duration <= target) break;
  }

  const tNew = computeProjectDuration(activities, workingDurations);

  return { selectedIds, totalCost, tNew };
}
