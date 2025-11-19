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
}

export default BaseController;
