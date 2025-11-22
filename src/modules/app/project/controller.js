import BaseController from '../../../controllers/index.js';
import projectService from './service.js';
import moment from 'moment';
import path from 'path';
import { fileURLToPath } from 'url';
import userRepository from '../../../repositories/user/index.js';
import projectStatusService from '../project-status/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.store = this.store.bind(this);
    this.edit = this.edit.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.show = this.show.bind(this);
  }

  _formatProjectData(projects) {
    if (!Array.isArray(projects)) projects = [projects];
    return projects.map((p) => {
      let statusBadgeClass = 'bg-secondary';
      if (p.status_name) {
        const status = p.status_name.toLowerCase();
        if (status.includes('planning')) statusBadgeClass = 'bg-info text-dark';
        else if (status.includes('progress')) statusBadgeClass = 'bg-primary';
        else if (status.includes('completed')) statusBadgeClass = 'bg-success';
        else if (status.includes('hold')) statusBadgeClass = 'bg-warning text-dark';
        else if (status.includes('cancel')) statusBadgeClass = 'bg-danger';
      }

      return {
        ...p,
        formatted_start: p.start_date ? moment(p.start_date).format('YYYY-MM-DD') : '',
        formatted_end: p.end_date ? moment(p.end_date).format('YYYY-MM-DD') : '',
        formatted_actual_end: p.actual_end_date
          ? moment(p.actual_end_date).format('YYYY-MM-DD')
          : '', // Handle jika null jadi string kosong

        formatted_budget: new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(p.budget || 0),

        is_active_bool: p.is_active === 1 || p.is_active === true || p.is_active === '1',
        status_badge_class: statusBadgeClass,
      };
    });
  }

  _processPayload(body) {
    return {
      ...body,
      is_active: body.is_active === '1' || body.is_active === 1 || body.is_active === true,
      // REVISI: Jika actual_end_date string kosong (tidak diisi), ubah jadi null
      actual_end_date: body.actual_end_date === '' ? null : body.actual_end_date,
    };
  }

  async index(req, res) {
    try {
      const search = req.query.search;
      let projects;
      if (search) {
        projects = await projectService.searchProjects(search);
      } else {
        projects = await projectService.getAllProjects();
      }
      projects = this._formatProjectData(projects);
      const viewPath = path.join(__dirname, '../../../views/app/project/home/index');
      return res.render(viewPath, {
        title: 'Projects',
        projects,
        hasProjects: projects.length > 0,
        user: this.getSessionUser(req),
        searchQuery: search,
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load projects', 500, error);
    }
  }

  async create(req, res) {
    try {
      const users = await userRepository.getAll();
      const statuses = await projectStatusService.getAllActiveStatuses();

      const viewPath = path.join(__dirname, '../../../views/app/project/detail/index');
      return res.render(viewPath, {
        title: 'Create Project',
        mode: 'create',
        isCreate: true,
        formAction: '/app/project',
        submitButtonText: 'Create Project',
        project: { is_active_bool: true },
        users: users,
        statuses: statuses,
        user: this.getSessionUser(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load create form', 500, error);
    }
  }

  async store(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const payload = this._processPayload(req.body);

      await projectService.createProject(payload, userId);
      return this.redirect(res, '/app/project');
    } catch (error) {
      const users = await userRepository.getAll();
      const statuses = await projectStatusService.getAllActiveStatuses();
      const viewPath = path.join(__dirname, '../../../views/app/project/detail/index');

      const usersWithSelection = users.map((u) => ({
        ...u,
        selected: u.user_id == req.body.project_manager,
      }));
      const statusesWithSelection = statuses.map((s) => ({
        ...s,
        selected: s.project_status_id == req.body.status,
      }));

      const projectData = {
        ...req.body,
        is_active_bool: req.body.is_active === '1',
      };

      return res.render(viewPath, {
        title: 'Create Project',
        mode: 'create',
        isCreate: true,
        formAction: '/app/project',
        submitButtonText: 'Create Project',
        project: projectData,
        users: usersWithSelection,
        statuses: statusesWithSelection,
        error: error.message,
        user: this.getSessionUser(req),
        currentPath: '/app/project',
      });
    }
  }

  async edit(req, res) {
    try {
      let project = await projectService.getProjectById(req.params.id);
      [project] = this._formatProjectData([project]);

      const users = await userRepository.getAll();
      const statuses = await projectStatusService.getAllActiveStatuses();

      const usersWithSelection = users.map((u) => ({
        ...u,
        selected: u.user_id === project.project_manager,
      }));
      const statusesWithSelection = statuses.map((s) => ({
        ...s,
        selected: s.project_status_id === project.status,
      }));

      const viewPath = path.join(__dirname, '../../../views/app/project/detail/index');
      return res.render(viewPath, {
        title: 'Edit Project',
        mode: 'edit',
        isEdit: true,
        formAction: `/app/project/${req.params.id}`,
        submitButtonText: 'Update Project',
        project,
        users: usersWithSelection,
        statuses: statusesWithSelection,
        user: this.getSessionUser(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load edit form', 500, error);
    }
  }

  async update(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const payload = this._processPayload(req.body);
      await projectService.updateProject(req.params.id, payload, userId);
      return this.redirect(res, '/app/project');
    } catch (error) {
      return this.sendError(res, 'Failed to update', 500, error);
    }
  }

  async destroy(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      await projectService.deleteProject(req.params.id, userId);
      return this.redirect(res, '/app/project');
    } catch (error) {
      return this.sendError(res, 'Failed to delete', 500, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      let project = await projectService.getProjectById(id);

      [project] = this._formatProjectData([project]);

      const viewPath = path.join(__dirname, '../../../views/app/project/show/index');

      return res.render(viewPath, {
        title: `Project: ${project.name}`,
        project,
        user: this.getSessionUser(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load project details', 500, error);
    }
  }
}

export default new ProjectController();
