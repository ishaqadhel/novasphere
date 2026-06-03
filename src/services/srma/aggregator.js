export function aggregateResults(iterations, targetDuration) {
  if (!iterations || iterations.length === 0) {
    return {
      scurvePoints: [],
      onTimeProbability: 0,
      activityCriticality: new Map(),
      measureCriticality: new Map(),
      meanNetCost: 0,
    };
  }

  const N = iterations.length;

  // S-curve: histogram of tNew values
  const durations = iterations.map((r) => r.tNew);
  const minDur = Math.floor(Math.min(...durations));
  const maxDur = Math.ceil(Math.max(...durations));

  const buckets = new Map();
  for (let d = minDur; d <= maxDur; d++) {
    buckets.set(d, 0);
  }

  for (const dur of durations) {
    const bucket = Math.round(dur);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }

  // Compute cumulative probability
  const scurvePoints = [];
  let cumCount = 0;
  const sortedBuckets = [...buckets.entries()].sort((a, b) => a[0] - b[0]);

  for (const [d, count] of sortedBuckets) {
    cumCount += count;
    scurvePoints.push({
      duration_days: d,
      cumulative_probability: parseFloat((cumCount / N).toFixed(4)),
    });
  }

  // On-time probability
  const onTimeCount = durations.filter((d) => d <= targetDuration).length;
  const onTimeProbability = parseFloat((onTimeCount / N).toFixed(4));

  // Activity criticality: frequency on critical path
  const critFreq = new Map();
  for (const iter of iterations) {
    for (const taskId of iter.criticalPath) {
      critFreq.set(taskId, (critFreq.get(taskId) || 0) + 1);
    }
  }

  const activityCriticality = new Map();
  for (const [taskId, freq] of critFreq.entries()) {
    activityCriticality.set(taskId, parseFloat((freq / N).toFixed(4)));
  }

  // Measure criticality: usage frequency and avg cost contribution
  const measureFreq = new Map();
  const measureCostSum = new Map();

  for (const iter of iterations) {
    for (const measId of iter.measuresUsed) {
      measureFreq.set(measId, (measureFreq.get(measId) || 0) + 1);
      measureCostSum.set(measId, (measureCostSum.get(measId) || 0) + (iter.netCost || 0));
    }
  }

  const measureCriticality = new Map();
  for (const [measId, freq] of measureFreq.entries()) {
    measureCriticality.set(measId, {
      usage_frequency: parseFloat((freq / N).toFixed(4)),
      avg_cost_contribution: parseFloat((measureCostSum.get(measId) / freq).toFixed(2)),
    });
  }

  // Mean net cost
  const meanNetCost = parseFloat(
    (iterations.reduce((sum, r) => sum + (r.netCost || 0), 0) / N).toFixed(2)
  );

  return { scurvePoints, onTimeProbability, activityCriticality, measureCriticality, meanNetCost };
}
