import BaseController from '../../../controllers/index.js';
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

  async index(req, res) {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      return this.renderView(res, 'app/supplier/home', {
        title: 'Supplier Management',
        suppliers,
        hasSuppliers: suppliers.length > 0,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load suppliers', 500, error);
    }
  }

  async create(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const newSupplier = await supplierService.createSupplier(req.body, userId);

      return this.renderView(res, 'app/supplier/row', newSupplier, false);
    } catch (error) {
      const errorHtml = `
        <div id="alert-container" hx-swap-oob="true">
          <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${error.message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        </div>
      `;
      return res.send(errorHtml);
    }
  }

  async editForm(req, res) {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      return this.renderView(res, 'app/supplier/edit', supplier, false);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  async update(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const updatedSupplier = await supplierService.updateSupplier(req.params.id, req.body, userId);
      return this.renderView(res, 'app/supplier/row', updatedSupplier, false);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  }

  async delete(req, res) {
    try {
      await supplierService.deleteSupplier(req.params.id);
      return res.send('');
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
}

export default new SupplierController();
