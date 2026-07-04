# Novasphere AI Features — Detailed Documentation

> Three AI-powered analytical features in the Reports module.  
> Routes: `GET /app/report/predictive-delay`, `GET /app/report/supplier-performance`, `GET /app/report/in-depth-analytics`

---

## Table of Contents

1. [SRMA — Schedule Risk & Mitigation Analysis](#1-srma--schedule-risk--mitigation-analysis)
2. [Supplier Analytics](#2-supplier-analytics)
3. [Advanced Analytics (In-Depth Analytics)](#3-advanced-analytics-in-depth-analytics)

---

---

# 1. SRMA — Schedule Risk & Mitigation Analysis

**What it does:**  
Given a project's tasks, dependencies, risk events, and mitigation measures — run thousands of simulated futures and answer: *"What is the probability this project finishes on time? Which tasks are the biggest risk? What should we do about it?"*

**Route:** `GET /app/report/predictive-delay`  
**Trigger run:** `POST /app/report/predictive-delay/run` (user-triggered, 2000 iterations)  
**Auto-run:** Cron job every 7 days per project (1000 iterations)

---

## 1.1 Data Loading (`data-loader.js`)

Before simulation, the system loads and prepares inputs from the database.

### Step 1 — Load project
```
projects table → start_date, end_date, daily_penalty_amount, daily_reward_amount
targetDurationDays = end_date - start_date (in days)
```

### Step 2 — Load tasks with PERT durations
Each task needs 3 duration estimates (optimistic / most-likely / pessimistic).  
If a task doesn't have them, they are **auto-calculated**:

```
ml  = task.duration_most_likely_days  OR  (end_date - start_date)
opt = task.duration_optimistic_days   OR  ml × 0.85
pes = task.duration_pessimistic_days  OR  ml × 1.25
```

### Step 3 — Load dependencies
Only Finish-to-Start (`FS`) dependencies are loaded.  
These define the **sequence**: task B cannot start until task A finishes.

### Step 4 — Load risk events
Risk events are stored explicitly in `risk_events` table.  
Each risk has:
- `probability` — likelihood it occurs (0 to 1)
- Impact durations: `impactOpt`, `impactML`, `impactPess` (in days)
- Which tasks it affects: `affectedTaskIds`

**Auto-seed fallback:** If NO explicit risks exist, the system mines real supplier delivery data:

```sql
SELECT supplier_id, late_count / total_count AS probability,
       AVG(delay_days) AS avg_delay
FROM project_material_requirements
WHERE actual_arrived_date IS NOT NULL
```

A supplier risk is created only if `probability > 0.05` (more than 5% late rate).  
The risk is assumed to affect ALL tasks in the project.

### Step 5 — Load mitigation measures
Each mitigation has:
- Capacity: how many days it can reduce (`capOpt`, `capML`, `capPess`)
- Cost: how much it costs (`costMin`, `costML`, `costMax`)
- Which tasks it affects: `affectedTaskIds`

---

## 1.2 Simulation Engine (`simulation-engine.js`)

This is the core algorithm — a **Monte Carlo simulation** running N times (default 5000).

### What is Monte Carlo?
Instead of computing one answer, we simulate thousands of possible futures by randomly sampling uncertain values. The result is a **probability distribution**, not a single number.

### Per-iteration algorithm:

```
FOR i = 1 to N:
  1. Sample task durations (PERT)
  2. Apply risk events (probabilistic)
  3. Run CPM → get project duration (tCurr) + critical path
  4. If tCurr > target → run mitigation optimizer → get tNew
  5. Calculate net cost
  6. Store result
```

---

### Step A — Beta-PERT Sampling

For each task, instead of using the most-likely duration, we sample a random value.  
The **Beta-PERT** distribution is commonly used in project management:

```
mean = (opt + 4 × ml + pess) / 6
std  = (pess - opt) / 6

z = Box-Muller transform (random normal sample)
sampled_duration = clamp(mean + std × z, opt, pess)
```

**Why PERT?** It weights the most-likely value 4× more than the extremes, but still allows for optimistic/pessimistic outcomes. More realistic than a uniform distribution.

---

### Step B — Risk Event Application

For each risk event:
```
IF random() < risk.probability:
    impact = PERT_sample(impactOpt, impactML, impactPess)
    FOR each affected task:
        task_duration += impact
```

This simulates the risk "happening" or "not happening" in this iteration.

---

### Step C — Critical Path Method (CPM)

CPM is a classic project scheduling algorithm. It answers: **"What is the minimum possible project duration?"**

CPM runs two passes on the task dependency graph:

**Forward Pass** (computes Early Start / Early Finish):
```
For each task (in topological order):
    ES = max(EF of all predecessors)   // earliest I can start
    EF = ES + duration                 // earliest I can finish
projectDuration = max(EF of all tasks)
```

**Backward Pass** (computes Late Start / Late Finish):
```
For each task (in reverse topological order):
    LF = min(LS of all successors)     // latest I must finish
    LS = LF - duration                 // latest I can start
```

**Total Float / Slack:**
```
slack = LF - EF
```

**Critical Path** = all tasks where `slack ≈ 0`  
These are the tasks that, if delayed, delay the entire project.

**Topological Sort** (Kahn's algorithm) is used to process tasks in dependency order:
```
1. Count incoming edges (in-degree) for each task
2. Start with tasks that have no predecessors (in-degree = 0)
3. Process each task, reduce in-degree of successors
4. When a successor reaches in-degree 0, add it to the queue
```

---

### Step D — Mitigation Optimizer (`optimizer.js`)

Only runs if `tCurr > targetDurationDays` (project is predicted to be late).

**Goal:** Select the cheapest combination of mitigations to bring the project back on schedule.

**Algorithm:** Greedy selection by efficiency ratio:

```
For each mitigation:
    cap  = PERT_sample(capOpt, capML, capPess)   // how many days it saves
    cost = PERT_sample(costMin, costML, costMax)  // how much it costs
    ratio = cap / cost                            // efficiency: days-saved per dollar

Sort mitigations by ratio DESC

WHILE project_duration > target:
    Pick next mitigation (highest ratio)
    Apply it: reduce affected task durations by cap
    Recompute project duration
    IF duration <= target: STOP
```

**Why greedy?** It's not guaranteed to find the globally optimal solution, but it's fast and good enough for real-time simulation across 5000 iterations.

---

### Step E — Net Cost Calculation

```
penalty = max(0, tNew - target) × dailyPenalty   // cost per day late
reward  = max(0, target - tNew) × dailyReward    // savings per day early
netCost = mitigationCost + penalty - reward
```

---

## 1.3 Aggregation (`aggregator.js`)

After all N iterations, results are aggregated:

### S-Curve (Probability Distribution)
```
1. Collect all tNew values from all iterations
2. Build histogram: count how many iterations ended on each day
3. Compute cumulative sum → cumulative probability per day
```
The S-Curve shows: "There is X% probability the project finishes by day Y."

### On-Time Probability
```
onTimeProbability = (count of iterations where tNew <= target) / N
```

### Activity Criticality Index
```
For each task:
    criticality = (times task appeared on critical path) / N
```
A task with criticality = 0.85 means it was on the critical path in 85% of simulated futures.  
**Higher = riskier task.**

### Measure Criticality
```
For each mitigation:
    usage_frequency     = (times mitigation was selected) / N
    avg_cost_contribution = average netCost across iterations where it was used
```

### Mean Net Cost
```
meanNetCost = average(netCost) across all N iterations
```

---

## 1.4 Auto-Rerun & Alerting (`srma-auto-rerun-job.js`)

A scheduled job runs automatically:
- **Frequency:** every 7 days (only projects not run in last 7 days)
- **Iterations:** 1000 (reduced to avoid blocking)

**Alert logic:**
```
IF onTimeProbability < 0.50:
    Send warning notification to all PM and Supervisor users
    Alert message: "Project X has on-time probability of Y%. Immediate mitigation recommended."
    Deduplication: only 1 alert per project per user per day
```

**Risk classification:**
| P(on-time) | Risk Level |
|---|---|
| ≥ 70% | LOW RISK |
| 50–69% | MODERATE RISK |
| < 50% | HIGH RISK |

---

## 1.5 Database Tables

| Table | Purpose |
|---|---|
| `srma_runs` | One record per simulation run (status, probability, cost, timestamps) |
| `srma_run_scurve_point` | S-curve data points per run |
| `srma_run_activity_criticality` | Per-task criticality index per run |
| `srma_run_measure_criticality` | Per-mitigation usage + cost per run |
| `srma_alert_logs` | Deduplication log for alerts |

---

---

# 2. Supplier Analytics

**What it does:**  
Evaluates every supplier's performance across on-time delivery, defect rate, and ratings. Flags at-risk suppliers automatically.

**Route:** `GET /app/report/supplier-performance`  
**Source files:** `service.js` → `getSupplierPerformance()`, `getSupplierTrends()`

---

## 2.1 Core Metrics Per Supplier

All metrics are computed directly from raw delivery data in `project_material_requirements`.

### On-Time Rate
```
on_time_rate = (deliveries where actual_arrived_date <= arrived_date) 
               / (total deliveries with actual_arrived_date)  × 100
```
Measures: what % of shipments arrived on or before the promised date.

### Defect Rate
```
defect_rate = SUM(bad_quantity) / SUM(quantity) × 100
```
Measures: what % of delivered materials were defective/rejected.

### Average Detailed Rating
```
avg_detailed_rating = AVG(supplier_ratings.rating)
```
From manual rating records entered by users (separate from the main `suppliers.rating` field).

---

## 2.2 At-Risk Detection Algorithm

A supplier is flagged `is_at_risk = 1` if **any** of these conditions are true:

```
rating < 2.0                    → too low an overall score
OR defect_rate > 5%             → too many defective deliveries
OR on_time_rate < 80%           → too many late deliveries
```

This is computed entirely in SQL as a `CASE WHEN` expression — no post-processing needed.

In the UI, at-risk suppliers get **reason badges**:
- `Low Rating` — rating below 2.0
- `High Defect` — defect rate above 5%
- `Late Delivery` — on-time rate below 80%

---

## 2.3 Top Performer Detection

A supplier is a **top performer** if:
```
rating >= 4.0  AND  is_at_risk = 0
```

---

## 2.4 Monthly Trend Analysis (`getSupplierTrends`)

Tracks how each supplier's rating has changed over the last 12 months:

```sql
SELECT supplier_id, DATE_FORMAT(created_at, '%Y-%m') AS month,
       AVG(rating) AS avg_rating
FROM supplier_ratings
WHERE created_at >= (NOW - 12 months)
GROUP BY supplier_id, month
```

In the chart: top 5 highest-rated suppliers are shown as separate trend lines.  
Missing months show as `null` (gap in line chart).

---

## 2.5 Charts Rendered

| Chart | Type | Data |
|---|---|---|
| Supplier Rating Trends | Line (multi-series) | Top 5 suppliers, 12-month avg rating |
| On-Time Rate | Horizontal bar | Top 15 suppliers; red if < 80%, green if ≥ 80% |
| Defect Rate | Horizontal bar | Top 15 suppliers; red if > 5%, yellow if ≤ 5% |

---

## 2.6 Export

**XLSX** — 3-sheet workbook:
1. `Overview` — all suppliers with all metrics
2. `At-Risk Suppliers` — only flagged suppliers (red header)
3. `Monthly Trends` — 12-month rating trend data

**PDF** — Sections:
1. Summary stats (total/active suppliers, avg rating)
2. At-risk supplier list with metrics
3. Top performers list (rating ≥ 4.0)

---

---

# 3. Advanced Analytics (In-Depth Analytics)

**What it does:**  
A multi-dimensional KPI dashboard that combines Schedule, Quality, and Budget metrics across all projects. Supports real-time filtering via HTMX (no full page reload).

**Route:** `GET /app/report/in-depth-analytics`  
**Source files:** `service.js` → `getInDepthAnalytics()`, `controller.js` → `inDepthAnalytics()`

---

## 3.1 Filters

The filter bar sends requests with these query params:

| Param | Description |
|---|---|
| `projectId` | Scope to one project (optional) |
| `kpi` | `all` / `schedule` / `quality` / `budget` |
| `start` | Filter by `project.start_date >= start` |
| `end` | Filter by `project.end_date <= end` |

**HTMX partial rendering:** When filter changes, only the `#analytics-content` div is swapped (detected via `hx-request` header). The outer layout/sidebar is not re-rendered.

---

## 3.2 Schedule KPIs

Computed per project:

### Schedule Performance Index (SPI)
```
SPI = planned_duration / actual_duration

planned_duration = end_date - start_date  (days)
actual_duration  = (actual_end_date OR today) - start_date  (days)
```

- `SPI >= 1.0` → on schedule or ahead (green)
- `SPI < 1.0` → behind schedule (red)

**Example:** Planned 100 days, currently 120 days in → SPI = 100/120 = 0.83 (behind)

### Days Overdue
```
days_overdue = IF (actual_end_date IS NULL AND today > end_date)
               THEN today - end_date
               ELSE 0
```

### Task Completion Rate
```
completion_rate = (tasks with status = 'Completed') / total_tasks × 100
```

### Summary Aggregates
```
avg_spi              = average SPI across all projects
avg_task_completion  = average completion rate across all projects
total_delayed        = count of projects where days_overdue > 0
```

---

## 3.3 Quality KPIs

Monthly time series showing defect rate trends:

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       SUM(bad_quantity) / SUM(quantity) × 100 AS defect_rate
FROM project_material_requirements
GROUP BY month
ORDER BY month ASC
```

**Threshold:** 5% — shown as a dashed reference line in the chart.  
If `avg_defect_rate > 5%` → summary card shows red.

---

## 3.4 Budget KPIs

Per project:
```
budget        → from projects.budget
total_orders  → COUNT of project_material_requirements
total_items   → SUM(good_quantity + bad_quantity)
```

Rendered as a **dual-axis bar chart**:
- Left Y-axis: Budget (NT$)
- Right Y-axis: Total Orders (count)

This lets you compare spending capacity vs. actual procurement volume side-by-side.

---

## 3.5 Charts

| ID | Type | X-Axis | Y-Axis |
|---|---|---|---|
| `scheduleChart` | Horizontal bar | SPI value | Project names |
| `qualityChart` | Line | Month | Defect rate % |
| `budgetChart` | Dual-axis bar | Project names | Budget (left) + Orders (right) |
| `completionChart` | Horizontal bar | Completion % | Project names |

Charts are initialized on page load via inline `<script>`.  
After HTMX swap, the partial view includes its own inline script to re-initialize charts.

---

## 3.6 Full Data Flow

```
User changes filter
    │
    ▼ (HTMX GET /app/report/in-depth-analytics?filters...)
Controller: inDepthAnalytics()
    │
    ├─ getInDepthAnalytics(filters)
    │      ├─ scheduleQuery  (SPI, completion, overdue per project)
    │      ├─ qualityQuery   (monthly defect rate)
    │      └─ budgetQuery    (budget + orders per project)
    │      → runs all 3 in parallel (Promise.all)
    │
    ├─ Build Chart.js JSON datasets
    │
    └─ Detect hx-request header
           ├─ true  → render partial view (swap #analytics-content only)
           └─ false → render full page
```

---

## Summary Comparison

| Feature | Algorithm | Data Source | Output |
|---|---|---|---|
| **SRMA** | Monte Carlo + CPM + Greedy optimizer | Tasks, risks, mitigations, supplier PMR | On-time probability, S-curve, criticality |
| **Supplier Analytics** | SQL aggregation + threshold rules | PMR deliveries, supplier ratings | At-risk flag, on-time/defect rates, trends |
| **Advanced Analytics** | SQL KPI aggregation | Projects, tasks, PMR | SPI, defect trend, budget vs orders |
