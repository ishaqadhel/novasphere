import { Router } from 'express';
import controller from './controller.js';

const router = Router();

router.get('/', controller.index);
router.post('/', controller.create);
router.get('/:id/edit', controller.editForm);

router.get('/:id/row', controller.getRow);

router.put('/:id', controller.update);
router.post('/:id/delete', controller.delete);

export default router;
