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

  renderView(res, view, data = {}, layout = 'layout/sidebar/index') {
    if (layout === false) {
      // 不使用 layout，直接渲染 partial
      return res.render(view, data);
    }

    // 使用 layout：將內容視圖渲染後嵌入 layout
    // 先渲染內容視圖為字串
    res.render(view, data, (err, contentHtml) => {
      if (err) {
        console.error('Error rendering view:', err);
        return res.status(500).send('Error rendering page');
      }

      // 再將內容嵌入 layout 中渲染
      res.render(layout, {
        ...data,
        body: contentHtml,
      });
    });
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
