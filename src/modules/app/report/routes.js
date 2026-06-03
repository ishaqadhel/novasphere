import { Router } from 'express';
import controller from './controller.js';

const router = Router();

router.get('/', (req, res) => controller.index(req, res));
router.get('/project-summary', (req, res) => controller.projectSummary(req, res));
router.get('/risk-analysis', (req, res) => controller.riskAnalysis(req, res));
router.get('/material-usage', (req, res) => controller.materialUsage(req, res));
router.get('/quality-control', (req, res) => controller.qualityControl(req, res));
router.get('/supplier-performance', (req, res) => controller.supplierPerformance(req, res));
router.get('/export', (req, res) => controller.exportReport(req, res));

// F2: Predictive Delay (SRMA)
router.get('/predictive-delay', (req, res) => controller.predictiveDelay(req, res));
router.post('/predictive-delay/run', (req, res) => controller.runSrma(req, res));

// F3: In-Depth Analytics
router.get('/in-depth-analytics', (req, res) => controller.inDepthAnalytics(req, res));

export default router;
