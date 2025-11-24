import { Router } from 'express';
import supplierController from './controller.js';

const router = Router();

router.get('/', (req, res) => supplierController.index(req, res));
router.post('/', (req, res) => supplierController.create(req, res));
router.get('/edit/:id', (req, res) => supplierController.editForm(req, res));
router.put('/:id', (req, res) => supplierController.update(req, res));
router.delete('/:id', (req, res) => supplierController.delete(req, res));

export default router;
