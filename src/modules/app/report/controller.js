import BaseController from '../../../controllers/index.js';
import reportService from './service.js';

class ReportController extends BaseController {
  async index(req, res) {
    try {
      return this.renderView(res, 'app/report/home', {
        title: 'Reports & Analytics',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load reports', 500, error);
    }
  }

  async projectSummary(req, res) {
    try {
      const reportData = await reportService.getProjectSummary();
      return this.renderView(res, 'app/report/project-summary', {
        title: 'Project Summary Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load project summary report', 500, error);
    }
  }

  async materialUsage(req, res) {
    try {
      const reportData = await reportService.getMaterialUsage();
      return this.renderView(res, 'app/report/material-usage', {
        title: 'Material Usage Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load material usage report', 500, error);
    }
  }

  async supplierPerformance(req, res) {
    try {
      const reportData = await reportService.getSupplierPerformance();
      return this.renderView(res, 'app/report/supplier-performance', {
        title: 'Supplier Performance Report',
        user: this.getSessionUser(req),
        permissions: this.getPermissions(req),
        reportData,
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load supplier performance report', 500, error);
    }
  }
}
export default new ReportController();
