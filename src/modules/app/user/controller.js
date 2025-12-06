import BaseController from '../../../controllers/index.js';
import userService from './service.js';

class UserController extends BaseController {
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
      const users = await userService.getAllUsers();

      return this.renderView(res, 'app/user/home/index', {
        title: 'Users',
        users,
        hasUsers: users.length > 0,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load users', 500, error);
    }
  }

  async create(req, res) {
    try {
      const roles = await userService.getAllRoles();

      return this.renderView(res, 'app/user/detail/index', {
        title: 'Create User',
        mode: 'create',
        isCreate: true,
        isEdit: false,
        isView: false,
        formAction: '/app/user',
        submitButtonText: 'Create User',
        userData: { is_active: true },
        roles,
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
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone: req.body.phone,
        role_id: req.body.role_id,
        is_active: req.body.is_active === 'true' || req.body.is_active === true,
      };

      await userService.createUser(data);

      return this.redirect(res, '/app/user');
    } catch (error) {
      const roles = await userService.getAllRoles();
      return this.renderView(res, 'app/user/detail/index', {
        title: 'Create User',
        mode: 'create',
        isCreate: true,
        isEdit: false,
        isView: false,
        formAction: '/app/user',
        submitButtonText: 'Create User',
        userData: req.body,
        roles,
        error: error.message,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const userData = await userService.getUserById(id);
      const roles = await userService.getAllRoles();

      // Mark selected role
      const rolesWithSelection = roles.map((role) => ({
        ...role,
        selected: role.role_id === userData.role_id,
      }));

      return this.renderView(res, 'app/user/detail/index', {
        title: 'View User',
        mode: 'view',
        isCreate: false,
        isEdit: false,
        isView: true,
        formAction: `/app/user/${id}`,
        submitButtonText: 'Update User',
        userData,
        roles: rolesWithSelection,
        error: null,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load user', 500, error);
    }
  }

  async edit(req, res) {
    try {
      const { id } = req.params;
      const userData = await userService.getUserById(id);
      const roles = await userService.getAllRoles();

      // Mark selected role
      const rolesWithSelection = roles.map((role) => ({
        ...role,
        selected: role.role_id === userData.role_id,
      }));

      return this.renderView(res, 'app/user/detail/index', {
        title: 'Edit User',
        mode: 'edit',
        isCreate: false,
        isEdit: true,
        isView: false,
        formAction: `/app/user/${id}`,
        submitButtonText: 'Update User',
        userData,
        roles: rolesWithSelection,
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
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone: req.body.phone,
        role_id: req.body.role_id,
        is_active: req.body.is_active === 'true' || req.body.is_active === true,
      };

      await userService.updateUser(id, data);

      return this.redirect(res, '/app/user');
    } catch (error) {
      const userData = await userService.getUserById(req.params.id);
      const roles = await userService.getAllRoles();

      // Merge user with submitted data and mark selected role
      const updatedUser = { ...userData, ...req.body };
      const rolesWithSelection = roles.map((role) => ({
        ...role,
        selected: role.role_id == req.body.role_id,
      }));

      return this.renderView(res, 'app/user/detail/index', {
        title: 'Edit User',
        mode: 'edit',
        isCreate: false,
        isEdit: true,
        isView: false,
        formAction: `/app/user/${req.params.id}`,
        submitButtonText: 'Update User',
        userData: updatedUser,
        roles: rolesWithSelection,
        error: error.message,
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      return this.redirect(res, '/app/user');
    } catch (error) {
      return this.sendError(res, 'Failed to delete user', 500, error);
    }
  }
}

export default new UserController();
