class AuthMiddleware {
  constructor() {
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.redirectIfAuthenticated = this.redirectIfAuthenticated.bind(this);
  }

  isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    }

    return res.redirect('/auth/login');
  }

  redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return res.redirect('/app/supplier');
    }

    return next();
  }

  attachUserToLocals(req, res, next) {
    res.locals.user = req.session?.user || null;
    res.locals.isAuthenticated = !!req.session?.user;
    next();
  }
}

export default new AuthMiddleware();
