import BaseController from '../../../controllers/index.js';
import materialService from './service.js';
import materialCategoryService from '../material-category/service.js';

class MaterialController extends BaseController {
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
      const materials = await materialService.getAllMaterials();

      return this.renderView(res, 'app/material/home/index', {
        title: 'Materials',
        materials,
        hasMaterials: materials.length > 0,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load materials', 500, error);
    }
  }

  async create(req, res) {
    try {
      const categories = await materialCategoryService.getAllActiveMaterialCategories();

      return this.renderView(res, 'app/material/detail/index', {
        title: 'Create Material',
        mode: 'create',
        isCreate: true,
        isEdit: false,
        isView: false,
        formAction: '/app/material',
        submitButtonText: 'Create Material',
        material: { is_active: true },
        categories,
        error: null,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load create form', 500, error);
    }
  }

  async store(req, res) {
    try {
      const data = {
        name: req.body.name,
        material_category_id: req.body.material_category_id,
        is_active: req.body.is_active === 'true' || req.body.is_active === true,
      };

      await materialService.createMaterial(data);

      return this.redirect(res, '/app/material');
    } catch (error) {
      const categories = await materialCategoryService.getAllActiveMaterialCategories();
      return this.renderView(res, 'app/material/detail/index', {
        title: 'Create Material',
        mode: 'create',
        isCreate: true,
        isEdit: false,
        isView: false,
        formAction: '/app/material',
        submitButtonText: 'Create Material',
        material: req.body,
        categories,
        error: error.message,
        user: this.getSessionUser(req),
      });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const material = await materialService.getMaterialById(id);
      const categories = await materialCategoryService.getAllActiveMaterialCategories();

      // Mark selected category
      const categoriesWithSelection = categories.map(cat => ({
        ...cat,
        selected: cat.material_category_id === material.material_category_id
      }));

      return this.renderView(res, 'app/material/detail/index', {
        title: 'View Material',
        mode: 'view',
        isCreate: false,
        isEdit: false,
        isView: true,
        formAction: `/app/material/${id}`,
        submitButtonText: 'Update Material',
        material,
        categories: categoriesWithSelection,
        error: null,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load material', 500, error);
    }
  }

  async edit(req, res) {
    try {
      const { id } = req.params;
      const material = await materialService.getMaterialById(id);
      const categories = await materialCategoryService.getAllActiveMaterialCategories();

      // Mark selected category
      const categoriesWithSelection = categories.map(cat => ({
        ...cat,
        selected: cat.material_category_id === material.material_category_id
      }));

      return this.renderView(res, 'app/material/detail/index', {
        title: 'Edit Material',
        mode: 'edit',
        isCreate: false,
        isEdit: true,
        isView: false,
        formAction: `/app/material/${id}`,
        submitButtonText: 'Update Material',
        material,
        categories: categoriesWithSelection,
        error: null,
        user: this.getSessionUser(req),
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
        material_category_id: req.body.material_category_id,
        is_active: req.body.is_active === 'true' || req.body.is_active === true,
      };

      await materialService.updateMaterial(id, data);

      return this.redirect(res, '/app/material');
    } catch (error) {
      const material = await materialService.getMaterialById(req.params.id);
      const categories = await materialCategoryService.getAllActiveMaterialCategories();

      // Merge material with submitted data and mark selected category
      const updatedMaterial = { ...material, ...req.body };
      const categoriesWithSelection = categories.map(cat => ({
        ...cat,
        selected: cat.material_category_id == req.body.material_category_id
      }));

      return this.renderView(res, 'app/material/detail/index', {
        title: 'Edit Material',
        mode: 'edit',
        isCreate: false,
        isEdit: true,
        isView: false,
        formAction: `/app/material/${req.params.id}`,
        submitButtonText: 'Update Material',
        material: updatedMaterial,
        categories: categoriesWithSelection,
        error: error.message,
        user: this.getSessionUser(req),
      });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await materialService.deleteMaterial(id);

      return this.redirect(res, '/app/material');
    } catch (error) {
      return this.sendError(res, 'Failed to delete material', 500, error);
    }
  }
}

export default new MaterialController();
