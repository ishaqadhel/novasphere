import { Router } from 'express';
import controller from './controller.js';

const router = Router();

// 1. 報表首頁 (儀表板)
// 對應 Controller 的 index 方法，提供 KPI 摘要
router.get('/', (req, res) => controller.index(req, res));

// 2. 專案摘要
router.get('/project-summary', (req, res) => controller.projectSummary(req, res));

// 3. 風險與時程警報
// 對應 Controller 的 riskAnalysis 方法 (MVP 功能：預先延遲警報)
router.get('/risk-analysis', (req, res) => controller.riskAnalysis(req, res));

// 4. 材料用量
router.get('/material-usage', (req, res) => controller.materialUsage(req, res));

// 5. 品質控管
// 對應 Controller 的 qualityControl 方法 (支援 Supervisor 標記與檢視不合規材料)
router.get('/quality-control', (req, res) => controller.qualityControl(req, res));

// 6. 供應商績效
router.get('/supplier-performance', (req, res) => controller.supplierPerformance(req, res));

// 7. 報表導出功能
// 對應 Controller 的 exportReport 方法 (支援下載 PDF/CSV)
router.get('/export', (req, res) => controller.exportReport(req, res));

export default router;
