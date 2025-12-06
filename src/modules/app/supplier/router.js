import { Router } from 'express';
import supplierController from './controller.js';
import authMiddleware from '../../../middlewares/index.js';

const router = Router();

// Read operations (all authenticated users can access)
router.get('/', (req, res) => supplierController.index(req, res));

// Write operations (admin only)
router.post('/', authMiddleware.canAccess('supplier', 'create'), (req, res) =>
  supplierController.create(req, res)
);
router.get('/edit/:id', authMiddleware.canAccess('supplier', 'update'), (req, res) =>
  supplierController.editForm(req, res)
);
router.put('/:id', authMiddleware.canAccess('supplier', 'update'), (req, res) =>
  supplierController.update(req, res)
);
router.delete('/:id', authMiddleware.canAccess('supplier', 'delete'), (req, res) =>
  supplierController.delete(req, res)
);

export default router;
