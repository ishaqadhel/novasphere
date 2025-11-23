import { Router } from 'express';
import supplierController from './controller.js';

const router = Router();

// 1. 主頁面：顯示供應商列表
router.get('/', (req, res) => supplierController.index(req, res));

// 2. 動作：新增供應商 (HTMX)
router.post('/', (req, res) => supplierController.create(req, res));

// 3. 動作：取得編輯表單 (HTMX - 回傳 HTML 片段)
router.get('/edit/:id', (req, res) => supplierController.editForm(req, res));

// 4. 動作：更新供應商 (HTMX)
router.put('/:id', (req, res) => supplierController.update(req, res));

// 5. 動作：刪除供應商 (HTMX)
router.delete('/:id', (req, res) => supplierController.delete(req, res));

export default router;
