import BaseController from '../../controllers/index.js';
import supplierService from './service.js';

class SupplierController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.editForm = this.editForm.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * 主頁面：顯示供應商列表
   */
  async index(req, res) {
    try {
      const suppliers = await supplierService.getAllSuppliers();

      return this.renderView(res, 'app/supplier/home', {
        title: 'Supplier Management',
        suppliers: suppliers,
        user: req.session.user,
      });
    } catch (error) {
      console.error('Supplier index error:', error);
      return res.status(500).send('Failed to load suppliers: ' + error.message);
    }
  }

  /**
   * 動作：新增供應商 (HTMX 局部更新)
   */
  async create(req, res) {
    try {
      const user = req.session.user;
      const userId = user ? user.user_id : 1;
      const newSupplier = await supplierService.createSupplier(req.body, userId);

      return this.renderView(res, 'app/supplier/row', newSupplier, false);
    } catch (error) {
      res.status(400).send(`<div class="alert alert-danger">${error.message}</div>`);
    }
  }

  /**
   * 動作：取得編輯表單
   */
  async editForm(req, res) {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      return this.renderView(res, 'app/supplier/edit', supplier, false);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  /**
   * 動作：更新資料
   */
  async update(req, res) {
    try {
      const user = req.session.user;
      const userId = user ? user.user_id : 1;
      const updatedSupplier = await supplierService.updateSupplier(req.params.id, req.body, userId);
      return this.renderView(res, 'app/supplier/row', updatedSupplier, false);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  /**
   * 動作：刪除資料
   */
  async delete(req, res) {
    try {
      await supplierService.deleteSupplier(req.params.id);
      res.send('');
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
}

export default new SupplierController();
