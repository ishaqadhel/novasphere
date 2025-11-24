import { Router } from 'express';
import controller from './controller.js';

const router = Router({ mergeParams: true });

// 主頁面：顯示列表與新增表單
router.get('/', controller.index);

// 動作：新增需求 (HTMX)
router.post('/', controller.create);

router.get('/edit/:id', controller.editForm);
router.put('/:id', controller.update);

// 動作：刪除需求 (HTMX)
router.delete('/:id', controller.delete);

export default router;
