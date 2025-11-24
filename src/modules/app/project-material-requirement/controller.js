import BaseController from '../../../controllers/index.js';
import pmrService from './service.js';

// 引入其他 Repo 以獲取下拉選單資料
import projectRepository from '../../../repositories/project/index.js';
import materialRepository from '../../../repositories/material/index.js';
import supplierRepository from '../../../repositories/supplier/index.js';

class ProjectMaterialRequirementController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);

    // [關鍵修正] 必須綁定這兩個新方法，否則執行時會報錯
    this.editForm = this.editForm.bind(this);
    this.update = this.update.bind(this);
  }

  /**
   * 主頁面：顯示清單與新增表單
   */
  async index(req, res) {
    try {
      const projectId = req.params.projectId;

      // 平行執行所有查詢
      const [requirements, project, materials, suppliers] = await Promise.all([
        pmrService.getRequirementsByProjectId(projectId),
        projectRepository.getById(projectId),
        materialRepository.getAll(),
        supplierRepository.getAllActive
          ? supplierRepository.getAllActive()
          : supplierRepository.getAll(),
      ]);

      return this.renderView(res, 'app/project-material-requirement/home', {
        title: 'Project Materials',
        requirements,
        project,
        materials,
        suppliers,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load requirements', 500, error);
    }
  }

  /**
   * 動作：新增需求 (HTMX)
   */
  async create(req, res) {
    try {
      const user = this.getSessionUser(req);
      const userId = user ? user.user_id : 1;
      const projectId = req.params.projectId;

      // 將 projectId 加入到 body 中
      const dataWithProject = {
        ...req.body,
        project_id: projectId,
      };

      const newRequirement = await pmrService.createRequirement(dataWithProject, userId);

      // HTMX 只需要片段，維持原樣
      return this.renderView(res, 'app/project-material-requirement/row', newRequirement, false);
    } catch (error) {
      console.error(error);
      res.status(400).send(`<div class="alert alert-danger">${error.message}</div>`);
    }
  }

  /**
   * 動作：取得編輯表單 (HTMX)
   */
  async editForm(req, res) {
    try {
      const projectId = req.params.projectId;
      const requirement = await pmrService.getRequirementById(req.params.id);
      // 我們還需要下拉選單的資料，所以要再抓一次
      const [project, materials, suppliers] = await Promise.all([
        projectRepository.getById(projectId),
        materialRepository.getAll(),
        supplierRepository.getAllActive
          ? supplierRepository.getAllActive()
          : supplierRepository.getAll(),
      ]);

      return this.renderView(
        res,
        'app/project-material-requirement/edit',
        {
          ...requirement,
          project,
          materials,
          suppliers,
        },
        false
      );
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  /**
   * 動作：更新需求 (HTMX)
   */
  async update(req, res) {
    try {
      const user = this.getSessionUser(req);
      const userId = user ? user.user_id : 1;
      // 更新邏輯
      await pmrService.update(req.params.id, req.body, userId);
      // 更新後回傳新的 Row
      const updatedItem = await pmrService.getRequirementById(req.params.id);
      return this.renderView(res, 'app/project-material-requirement/row', updatedItem, false);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  /**
   * 動作：刪除需求 (HTMX)
   */
  async delete(req, res) {
    try {
      await pmrService.deleteRequirement(req.params.id);
      res.send('');
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  }
}

export default new ProjectMaterialRequirementController();
