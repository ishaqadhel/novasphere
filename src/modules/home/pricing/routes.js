import { Router } from 'express';
import controller from './controller.js';
const router = Router();
router.get('/', (req, res) => controller.index(req, res));
export default router;
