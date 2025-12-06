import { Router } from 'express';
import controller from './controller.js';
const router = Router();

router.get('/', (req, res) => controller.index(req, res));
router.get('/project-summary', (req, res) => controller.projectSummary(req, res));
router.get('/material-usage', (req, res) => controller.materialUsage(req, res));
router.get('/supplier-performance', (req, res) => controller.supplierPerformance(req, res));

export default router;
