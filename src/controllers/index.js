class BaseController {
  constructor() {
    if (new.target === BaseController) {
      throw new Error('Cannot instantiate abstract class BaseController directly');
    }
  }

  sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  sendError(res, message = 'An error occurred', statusCode = 500, error = null) {
    console.error('Controller Error:', error);
    return res.status(statusCode).json({
      success: false,
      message,
      error: error?.message || null,
    });
  }

  renderView(res, view, data = {}) {
    return res.render(view, data);
  }

  redirect(res, url, statusCode = 302) {
    return res.redirect(statusCode, url);
  }

  getSessionUser(req) {
    return req.session?.user || null;
  }

  getUserId(req) {
    return req.session?.user?.user_id || null;
  }

  isAuthenticated(req) {
    return !!req.session?.user;
  }

  /**
   * Check if current user has specific role(s)
   * @param {Object} req - Express request object
   * @param {string|Array<string>} allowedRoles - Role name(s) to check
   * @returns {boolean} True if user has one of the allowed roles
   */
  hasRole(req, allowedRoles) {
    const user = this.getSessionUser(req);
    if (!user || !user.role_name) return false;

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.some((role) => role.toLowerCase() === user.role_name.toLowerCase());
  }

  /**
   * Check if user can perform action on module
   * @param {Object} req - Express request object
   * @param {string} module - Module name (e.g., 'supplier', 'project')
   * @param {string} action - Action to perform (create, read, update, delete)
   * @returns {boolean} True if user has permission
   */
  canAccess(req, module, action = 'read') {
    const user = this.getSessionUser(req);
    if (!user || !user.role_name) return false;

    const role = user.role_name.toLowerCase();
    const act = action.toLowerCase();

    const PERMISSIONS = {
      admin: {
        supplier: ['create', 'read', 'update', 'delete'],
        user: ['create', 'read', 'update', 'delete'],
        material: ['create', 'read', 'update', 'delete'],
        'material-category': ['create', 'read', 'update', 'delete'],
        report: ['read'],
      },
      pm: {
        supplier: ['read'],
        user: ['read'],
        material: ['read'],
        'material-category': ['read'],
        project: ['create', 'read', 'update', 'delete'],
        'project-task': ['create', 'read', 'update', 'delete'],
        'project-material-requirement': ['create', 'read', 'update', 'delete'],
        report: ['read'],
      },
      supervisor: {
        supplier: ['read'],
        user: ['read'],
        material: ['read'],
        'material-category': ['read'],
        project: ['read'],
        'project-material-requirement': ['create', 'read', 'update', 'delete'],
        report: ['read'],
      },
    };

    const modulePerms = PERMISSIONS[role]?.[module];
    return modulePerms ? modulePerms.includes(act) : false;
  }

  /**
   * Get permissions object for view rendering
   * @param {Object} req - Express request object
   * @returns {Object} Permissions object with flags for each action
   */
  getPermissions(req) {
    const user = this.getSessionUser(req);
    if (!user || !user.role_name) {
      return {
        canAccessSupplier: false,
        canAccessUser: false,
        canAccessMaterial: false,
        canAccessMaterialCategory: false,
        canAccessProject: false,
        canAccessProjectTask: false,
        canAccessProjectMaterialRequirement: false,
        canAccessReport: false,
        canCreateSupplier: false,
        canEditSupplier: false,
        canDeleteSupplier: false,
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canCreateMaterial: false,
        canEditMaterial: false,
        canDeleteMaterial: false,
        canCreateMaterialCategory: false,
        canEditMaterialCategory: false,
        canDeleteMaterialCategory: false,
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canCreateProjectTask: false,
        canEditProjectTask: false,
        canDeleteProjectTask: false,
        canCreatePMR: false,
        canEditPMR: false,
        canDeletePMR: false,
      };
    }

    return {
      // Module access
      canAccessSupplier: this.canAccess(req, 'supplier', 'read'),
      canAccessUser: this.canAccess(req, 'user', 'read'),
      canAccessMaterial: this.canAccess(req, 'material', 'read'),
      canAccessMaterialCategory: this.canAccess(req, 'material-category', 'read'),
      canAccessProject: this.canAccess(req, 'project', 'read'),
      canAccessProjectTask: this.canAccess(req, 'project-task', 'read'),
      canAccessProjectMaterialRequirement: this.canAccess(
        req,
        'project-material-requirement',
        'read'
      ),
      canAccessReport: this.canAccess(req, 'report', 'read'),

      // Supplier actions
      canCreateSupplier: this.canAccess(req, 'supplier', 'create'),
      canEditSupplier: this.canAccess(req, 'supplier', 'update'),
      canDeleteSupplier: this.canAccess(req, 'supplier', 'delete'),

      // User actions
      canCreateUser: this.canAccess(req, 'user', 'create'),
      canEditUser: this.canAccess(req, 'user', 'update'),
      canDeleteUser: this.canAccess(req, 'user', 'delete'),

      // Material actions
      canCreateMaterial: this.canAccess(req, 'material', 'create'),
      canEditMaterial: this.canAccess(req, 'material', 'update'),
      canDeleteMaterial: this.canAccess(req, 'material', 'delete'),

      // Material Category actions
      canCreateMaterialCategory: this.canAccess(req, 'material-category', 'create'),
      canEditMaterialCategory: this.canAccess(req, 'material-category', 'update'),
      canDeleteMaterialCategory: this.canAccess(req, 'material-category', 'delete'),

      // Project actions
      canCreateProject: this.canAccess(req, 'project', 'create'),
      canEditProject: this.canAccess(req, 'project', 'update'),
      canDeleteProject: this.canAccess(req, 'project', 'delete'),

      // Project Task actions
      canCreateProjectTask: this.canAccess(req, 'project-task', 'create'),
      canEditProjectTask: this.canAccess(req, 'project-task', 'update'),
      canDeleteProjectTask: this.canAccess(req, 'project-task', 'delete'),

      // PMR actions
      canCreatePMR: this.canAccess(req, 'project-material-requirement', 'create'),
      canEditPMR: this.canAccess(req, 'project-material-requirement', 'update'),
      canDeletePMR: this.canAccess(req, 'project-material-requirement', 'delete'),
    };
  }
}

export default BaseController;
