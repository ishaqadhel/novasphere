import BaseController from '../../../controllers/index.js';
import pmrService from './service.js';
import projectRepository from '../../../repositories/project/index.js';
import materialRepository from '../../../repositories/material/index.js';
import supplierRepository from '../../../repositories/supplier/index.js';
import pmrStatusRepository from '../../../repositories/project-material-requirement-status/index.js';
import moment from 'moment';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectMaterialRequirementController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.editForm = this.editForm.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getRow = this.getRow.bind(this);
  }

  _formatData(items) {
    if (!Array.isArray(items)) items = [items];
    return items.map((item) => {
      let badgeClass = 'bg-secondary';
      const sName = item.status_name ? item.status_name.toLowerCase() : '';

      if (sName.includes('pending')) badgeClass = 'bg-warning text-dark';
      else if (sName.includes('approv') || sName.includes('received')) badgeClass = 'bg-success';
      else if (sName.includes('deliver')) badgeClass = 'bg-success';
      else if (sName.includes('reject')) badgeClass = 'bg-danger';

      return {
        ...item,
        formatted_price: new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
          minimumFractionDigits: 0,
        }).format(item.price),
        formatted_total: new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
          minimumFractionDigits: 0,
        }).format(item.total_price),
        formatted_arrived_date: item.arrived_date
          ? moment(item.arrived_date).format('YYYY-MM-DD')
          : '-',
        formatted_actual_date: item.actual_arrived_date
          ? moment(item.actual_arrived_date).format('YYYY-MM-DD')
          : '-',
        status_badge_class: badgeClass,
        is_delivered: item.status === 4,
      };
    });
  }

  async index(req, res) {
    try {
      const projectId = req.query.project_id;
      if (!projectId) return res.redirect('/app/project');

      const [requirements, project, materials, suppliers, statuses] = await Promise.all([
        pmrService.getRequirementsByProjectId(projectId),
        projectRepository.getOneById(projectId),
        materialRepository.getAll(),
        supplierRepository.getAll(),
        pmrStatusRepository.getAllActive(),
      ]);

      const formattedRequirements = this._formatData(requirements);

      return res.render('app/project-material-requirement/home/index', {
        title: `Materials: ${project.name}`,
        requirements: formattedRequirements,
        hasRequirements: formattedRequirements.length > 0,
        project,
        materials,
        suppliers,
        statuses,
        user: this.getSessionUser(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load requirements', 500, error);
    }
  }

  async create(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const newReq = await pmrService.createRequirement(req.body, userId);
      const [formatted] = this._formatData([newReq]);

      return res.render('app/project-material-requirement/home/row', {
        ...formatted,
        layout: false,
      });
    } catch (error) {
      return res.send(
        `<div id="alert-container" hx-swap-oob="true"><div class="alert alert-danger alert-dismissible fade show">${error.message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div></div>`
      );
    }
  }

  async editForm(req, res) {
    try {
      const { id } = req.params;
      let requirement = await pmrService.getRequirementById(id);

      const [materials, suppliers, statuses] = await Promise.all([
        materialRepository.getAll(),
        supplierRepository.getAll(),
        pmrStatusRepository.getAllActive(),
      ]);

      [requirement] = this._formatData([requirement]);

      const materialsSel = materials.map((m) => ({
        ...m,
        selected: m.material_id === requirement.material_id,
      }));
      const suppliersSel = suppliers.map((s) => ({
        ...s,
        selected: s.supplier_id === requirement.supplier_id,
      }));
      const statusesSel = statuses.map((s) => ({
        ...s,
        selected: s.project_material_requirement_status_id === requirement.status,
      }));

      return res.render('app/project-material-requirement/detail/edit', {
        ...requirement,
        materials: materialsSel,
        suppliers: suppliersSel,
        statuses: statusesSel,
        layout: false,
      });
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  async update(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;

      const updated = await pmrService.update(req.params.id, req.body, userId);
      const [formatted] = this._formatData([updated]);

      return res.render('app/project-material-requirement/home/row', {
        ...formatted,
        layout: false,
      });
    } catch (error) {
      try {
        const { id } = req.params;

        const original = await pmrService.getRequirementById(id);

        const [materials, suppliers, statuses] = await Promise.all([
          materialRepository.getAll(),
          supplierRepository.getAll(),
          pmrStatusRepository.getAllActive(),
        ]);

        const mergedData = { ...original, ...req.body };

        const materialsSel = materials.map((m) => ({
          ...m,
          selected: String(m.material_id) === String(req.body.material_id),
        }));
        const suppliersSel = suppliers.map((s) => ({
          ...s,
          selected: String(s.supplier_id) === String(req.body.supplier_id),
        }));
        const statusesSel = statuses.map((s) => ({
          ...s,
          selected: String(s.project_material_requirement_status_id) === String(req.body.status),
        }));

        const isDelivered = String(req.body.status) === '4';

        return res.render('app/project-material-requirement/detail/edit', {
          ...mergedData,

          formatted_arrived_date: req.body.arrived_date,
          formatted_actual_date: req.body.actual_arrived_date,

          materials: materialsSel,
          suppliers: suppliersSel,
          statuses: statusesSel,

          error: error.message,
          is_delivered: isDelivered,

          layout: false,
        });
      } catch (internalError) {
        return res.status(500).send(internalError.message);
      }
    }
  }

  async delete(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      await pmrService.deleteRequirement(req.params.id, userId);
      return res.send('');
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  async getRow(req, res) {
    try {
      const { id } = req.params;
      let requirement = await pmrService.getRequirementById(id);
      const [formatted] = this._formatData([requirement]);

      return res.render('app/project-material-requirement/home/row', {
        ...formatted,
        layout: false,
      });
    } catch (error) {
      return res.status(500).send('Error loading row');
    }
  }
}

export default new ProjectMaterialRequirementController();
