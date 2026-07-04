export function linearRegression(xyPoints) {
  const n = xyPoints.length;
  if (n < 2) return { slope: 0, intercept: xyPoints[0]?.y ?? 0, r2: 0 };

  const sumX = xyPoints.reduce((s, p) => s + p.x, 0);
  const sumY = xyPoints.reduce((s, p) => s + p.y, 0);
  const sumXY = xyPoints.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = xyPoints.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTot = xyPoints.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = xyPoints.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return {
    slope: parseFloat(slope.toFixed(4)),
    intercept: parseFloat(intercept.toFixed(4)),
    r2: parseFloat(r2.toFixed(4)),
  };
}

export function predict(model, x) {
  return parseFloat((model.slope * x + model.intercept).toFixed(2));
}

export function classifyTrend(slope) {
  if (slope > 0.05) return 'improving';
  if (slope < -0.05) return 'declining';
  return 'stable';
}

// Time-based split — first trainRatio% of points for training, rest for test.
// Never shuffle: shuffling time series leaks future data into training.
export function trainTestSplit(xyPoints, trainRatio = 0.8) {
  const trainSize = Math.max(2, Math.floor(xyPoints.length * trainRatio));
  return {
    train: xyPoints.slice(0, trainSize),
    test: xyPoints.slice(trainSize),
  };
}

// Compute R², RMSE, MAE of a model on a given set of points.
// Pass train points → train accuracy; pass test points → test accuracy.
export function computeAccuracy(model, xyPoints) {
  const n = xyPoints.length;
  if (n === 0) return { r2: null, rmse: null, mae: null };

  const errors = xyPoints.map((p) => p.y - predict(model, p.x));
  const mse = errors.reduce((s, e) => s + e * e, 0) / n;
  const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / n;

  const meanY = xyPoints.reduce((s, p) => s + p.y, 0) / n;
  const ssTot = xyPoints.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = errors.reduce((s, e) => s + e * e, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return {
    r2: parseFloat(r2.toFixed(4)),
    rmse: parseFloat(Math.sqrt(mse).toFixed(3)),
    mae: parseFloat(mae.toFixed(3)),
  };
}

export function addMonths(yyyyMM, n) {
  const [year, month] = yyyyMM.split('-').map(Number);
  const d = new Date(year, month - 1 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
