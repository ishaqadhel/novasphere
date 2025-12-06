class AuthMiddleware {
  constructor() {
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.redirectIfAuthenticated = this.redirectIfAuthenticated.bind(this);
    this.hasRole = this.hasRole.bind(this);
    this.canAccess = this.canAccess.bind(this);
    this.checkPermission = this.checkPermission.bind(this);
  }

  isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    }

    return res.redirect('/auth/login');
  }

  redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return res.redirect('/app/dashboard');
    }

    return next();
  }

  attachUserToLocals(req, res, next) {
    res.locals.user = req.session?.user || null;
    res.locals.isAuthenticated = !!req.session?.user;
    next();
  }

  /**
   * Check if user has required role(s)
   * @param {string|Array<string>} allowedRoles - Role name(s) to check
   * @returns {Function} Middleware function
   */
  hasRole(allowedRoles) {
    return (req, res, next) => {
      const user = req.session?.user;
      if (!user) {
        return res.redirect('/auth/login');
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const userRole = user.role_name?.toLowerCase();

      if (roles.some((role) => role.toLowerCase() === userRole)) {
        return next();
      }

      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        user: user,
        message: 'You do not have permission to access this page.',
      });
    };
  }

  /**
   * Check if user can perform action on module
   * @param {string} module - Module name (e.g., 'supplier', 'project')
   * @param {string} action - Action to perform (create, read, update, delete)
   * @returns {Function} Middleware function
   */
  canAccess(module, action = 'read') {
    return (req, res, next) => {
      const user = req.session?.user;
      if (!user) {
        return res.redirect('/auth/login');
      }

      if (this.checkPermission(user.role_name, module, action)) {
        return next();
      }

      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        user: user,
        message: 'You do not have permission to perform this action.',
      });
    };
  }

  /**
   * Check if a role has permission to perform an action on a module
   * @param {string} roleName - Role name
   * @param {string} module - Module name
   * @param {string} action - Action to perform
   * @returns {boolean} True if permission granted
   */
  checkPermission(roleName, module, action) {
    const role = roleName?.toLowerCase();
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
}

export default new AuthMiddleware();
