import BaseController from '../../../controllers/index.js';
import materialCategoryService from './service.js';

class MaterialCategoryController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.store = this.store.bind(this);
    this.show = this.show.bind(this);
    this.edit = this.edit.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  async index(req, res) {
    try {
      const materialCategories = await materialCategoryService.getAllMaterialCategories();

      return this.renderView(res, 'app/material-category/home/index', {
        title: 'Material Categories',
        materialCategories,
        hasMaterialCategories: materialCategories.length > 0,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load material categories', 500, error);
    }
  }

  async create(req, res) {
    try {
      return this.renderView(res, 'app/material-category/detail/index', {
        title: 'Create Material Category',
        mode: 'create',
        isCreate: true,
        isEdit: false,
        isView: false,
        formAction: '/app/material-category',
        submitButtonText: 'Create Material Category',
        materialCategory: { is_active: true },
        error: null,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load create form', 500, error);
    }
  }

  async store(req, res) {
    try {
      const data = {
        name: req.body.name,
        is_active: req.body.is_active === 'true' || req.body.is_active === true,
      };

      await materialCategoryService.createMaterialCategory(data);

      return this.redirect(res, '/app/material-category');
    } catch (error) {
      return this.renderView(res, 'app/material-category/detail/index', {
        title: 'Create Material Category',
        mode: 'create',
        isCreate: true,
        isEdit: false,
        isView: false,
        formAction: '/app/material-category',
        submitButtonText: 'Create Material Category',
        materialCategory: req.body,
        error: error.message,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const materialCategory = await materialCategoryService.getMaterialCategoryById(id);

      return this.renderView(res, 'app/material-category/detail/index', {
        title: 'View Material Category',
        mode: 'view',
        isCreate: false,
        isEdit: false,
        isView: true,
        formAction: `/app/material-category/${id}`,
        submitButtonText: 'Update Material Category',
        materialCategory,
        error: null,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load material category', 500, error);
    }
  }

  async edit(req, res) {
    try {
      const { id } = req.params;
      const materialCategory = await materialCategoryService.getMaterialCategoryById(id);

      return this.renderView(res, 'app/material-category/detail/index', {
        title: 'Edit Material Category',
        mode: 'edit',
        isCreate: false,
        isEdit: true,
        isView: false,
        formAction: `/app/material-category/${id}`,
        submitButtonText: 'Update Material Category',
        materialCategory,
        error: null,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load edit form', 500, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = {
        name: req.body.name,
        is_active: req.body.is_active === 'true' || req.body.is_active === true,
      };

      await materialCategoryService.updateMaterialCategory(id, data);

      return this.redirect(res, '/app/material-category');
    } catch (error) {
      const materialCategory = await materialCategoryService.getMaterialCategoryById(req.params.id);
      return this.renderView(res, 'app/material-category/detail/index', {
        title: 'Edit Material Category',
        mode: 'edit',
        isCreate: false,
        isEdit: true,
        isView: false,
        formAction: `/app/material-category/${req.params.id}`,
        submitButtonText: 'Update Material Category',
        materialCategory: { ...materialCategory, ...req.body },
        error: error.message,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await materialCategoryService.deleteMaterialCategory(id);

      return this.redirect(res, '/app/material-category');
    } catch (error) {
      return this.sendError(res, 'Failed to delete material category', 500, error);
    }
  }
}

export default new MaterialCategoryController();
