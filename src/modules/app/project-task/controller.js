import BaseController from '../../../controllers/index.js';
import projectTaskService from './service.js';
import projectService from '../project/service.js';
import userRepository from '../../../repositories/user/index.js';
import projectTaskStatusRepository from '../../../repositories/project-task-status/index.js';
import moment from 'moment';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectTaskController extends BaseController {
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

  _formatTaskData(tasks) {
    if (!Array.isArray(tasks)) tasks = [tasks];

    return tasks.map((t) => {
      let badgeClass = 'bg-secondary';
      if (t.status_name) {
        const s = t.status_name.toLowerCase();
        if (s.includes('to do')) badgeClass = 'bg-secondary';
        else if (s.includes('progress')) badgeClass = 'bg-primary';
        else if (s.includes('review')) badgeClass = 'bg-warning text-dark';
        else if (s.includes('done')) badgeClass = 'bg-success';
        else if (s.includes('cancel')) badgeClass = 'bg-danger';
      }

      return {
        ...t,
        formatted_start: t.start_date ? moment(t.start_date).format('YYYY-MM-DD') : '-',
        formatted_end: t.end_date ? moment(t.end_date).format('YYYY-MM-DD') : '-',
        formatted_actual_end: t.actual_end_date
          ? moment(t.actual_end_date).format('YYYY-MM-DD')
          : '',
        status_badge_class: badgeClass,
        is_active_bool: t.is_active === 1 || t.is_active === true,
      };
    });
  }

  _processPayload(body) {
    return {
      ...body,
      // Active Status
      is_active:
        body.is_active !== undefined ? body.is_active === '1' || body.is_active === true : true,
      actual_end_date: body.actual_end_date === '' ? null : body.actual_end_date,
      assigned_to: body.assigned_to === '' ? null : body.assigned_to,
    };
  }

  // Helper to filter Project Managers (Added)
  _filterProjectManagers(users) {
    return users.filter((u) => {
      const role = u.role_name ? u.role_name.toLowerCase() : '';
      return role === 'project manager' || role === 'pm' || role.includes('project manager');
    });
  }

  // 1. LIST TASKS
  async index(req, res) {
    try {
      const { project_id } = req.query;
      const search = req.query.search;

      if (!project_id) return res.redirect('/app/project');

      const project = await projectService.getProjectById(project_id);

      let tasks;
      if (search) {
        tasks = await projectTaskService.searchTasks(project_id, search);
      } else {
        tasks = await projectTaskService.getTasksByProject(project_id);
      }

      tasks = this._formatTaskData(tasks);

      const viewPath = path.join(__dirname, '../../../views/app/project-task/home/index');
      return res.render(viewPath, {
        title: `Tasks: ${project.name}`,
        project,
        tasks,
        hasTasks: tasks.length > 0,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        searchQuery: search,
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load tasks', 500, error);
    }
  }

  // 2. SHOW CREATE FORM
  async create(req, res) {
    try {
      const { project_id } = req.query;
      const project = await projectService.getProjectById(project_id);
      const users = await userRepository.getAll();
      const pmUsers = this._filterProjectManagers(users); // Filter applied here
      const statuses = await projectTaskStatusRepository.getAllActive();

      const viewPath = path.join(__dirname, '../../../views/app/project-task/detail/index');
      return res.render(viewPath, {
        title: 'Add Task',
        mode: 'create',
        isCreate: true,
        isView: false,
        formAction: `/app/project-task?project_id=${project_id}`,
        submitButtonText: 'Create Task',
        task: { project_id: project_id },
        project,
        users: pmUsers, // Passing filtered users
        statuses,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load create form', 500, error);
    }
  }

  // 3. STORE TASK
  async store(req, res) {
    try {
      const { project_id } = req.query;
      const userId = this.getSessionUser(req).user_id;
      const payload = this._processPayload({ ...req.body, project_id });

      await projectTaskService.createTask(payload, userId);
      return this.redirect(res, `/app/project-task?project_id=${project_id}`);
    } catch (error) {
      const { project_id } = req.query;
      return this.sendError(res, 'Failed to create task: ' + error.message, 500, error);
    }
  }

  // 4. SHOW DETAIL (READ ONLY / VIEW)
  async show(req, res) {
    try {
      const { id } = req.params;
      let task = await projectTaskService.getTaskById(id);
      const project = await projectService.getProjectById(task.project_id);

      [task] = this._formatTaskData([task]);

      const users = await userRepository.getAll();
      const pmUsers = this._filterProjectManagers(users); // Filter applied here
      const statuses = await projectTaskStatusRepository.getAllActive();

      const usersWithSelection = pmUsers.map((u) => ({
        ...u,
        selected: u.user_id === task.assigned_to,
      }));
      const statusesWithSelection = statuses.map((s) => ({
        ...s,
        selected: s.project_task_status_id === task.project_task_status_id,
      }));

      const viewPath = path.join(__dirname, '../../../views/app/project-task/detail/index');
      return res.render(viewPath, {
        title: 'View Task',
        mode: 'view',
        isView: true,
        isCreate: false,
        isEdit: false,
        formAction: '#',
        task,
        project,
        users: usersWithSelection,
        statuses: statusesWithSelection,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load task details', 500, error);
    }
  }

  // 5. SHOW EDIT FORM
  async edit(req, res) {
    try {
      const { id } = req.params;
      let task = await projectTaskService.getTaskById(id);
      const project = await projectService.getProjectById(task.project_id);

      [task] = this._formatTaskData([task]);

      const users = await userRepository.getAll();
      const pmUsers = this._filterProjectManagers(users); // Filter applied here
      const statuses = await projectTaskStatusRepository.getAllActive();

      const usersWithSelection = pmUsers.map((u) => ({
        ...u,
        selected: u.user_id === task.assigned_to,
      }));
      const statusesWithSelection = statuses.map((s) => ({
        ...s,
        selected: s.project_task_status_id === task.project_task_status_id,
      }));

      const viewPath = path.join(__dirname, '../../../views/app/project-task/detail/index');
      return res.render(viewPath, {
        title: 'Edit Task',
        mode: 'edit',
        isEdit: true,
        isView: false,
        formAction: `/app/project-task/${id}?project_id=${task.project_id}`,
        submitButtonText: 'Update Task',
        task,
        project,
        users: usersWithSelection,
        statuses: statusesWithSelection,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        currentPath: '/app/project',
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load edit form', 500, error);
    }
  }

  // 6. UPDATE TASK
  async update(req, res) {
    try {
      const { id } = req.params;
      const { project_id } = req.query;
      const userId = this.getSessionUser(req).user_id;
      const payload = this._processPayload(req.body);

      await projectTaskService.updateTask(id, payload, userId);
      return this.redirect(res, `/app/project-task?project_id=${project_id}`);
    } catch (error) {
      return this.sendError(res, 'Failed to update task', 500, error);
    }
  }

  // 7. DELETE TASK
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const { project_id } = req.query;
      const userId = this.getSessionUser(req).user_id;

      await projectTaskService.deleteTask(id, userId);
      return this.redirect(res, `/app/project-task?project_id=${project_id}`);
    } catch (error) {
      return this.sendError(res, 'Failed to delete task', 500, error);
    }
  }
}

export default new ProjectTaskController();
