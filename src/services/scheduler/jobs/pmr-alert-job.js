import pmrRepository from '../../../repositories/project-material-requirement/index.js';
import pmrAlertLogRepository from '../../../repositories/pmr-alert-log/index.js';
import notificationService from '../../notification/index.js';
import moment from 'moment';

/**
 * PMR Alert Job - Delay Risk Warning System
 *
 * Purpose: Alerts creators about materials at risk of delay
 *
 * Logic: When current_date is within 3 days of arrived_date AND status is NOT delivered,
 * this indicates a high risk of delay because:
 * - The material should arrive soon but hasn't been marked as delivered yet
 * - The creator needs to contact the supplier immediately to prevent project delays
 *
 * Example: If today is Dec 11 and material should arrive Dec 13 (2 days away),
 * but status is still "Pending" or "Ordered", there's a delay risk.
 */
class PmrAlertJob {
  constructor() {
    this.daysThreshold = 3;
    this.moduleId = 6; // PMR module ID
  }

  async execute() {
    const startTime = Date.now();
    let alertsSent = 0;
    let alertsSkipped = 0;

    try {
      const pmrsNeedingAlerts = await pmrRepository.getPendingArrivalsWithinDays(
        this.daysThreshold
      );

      console.log(
        `Found ${pmrsNeedingAlerts.length} PMRs arriving within ${this.daysThreshold} days`
      );

      for (const pmr of pmrsNeedingAlerts) {
        try {
          const alreadySent = await pmrAlertLogRepository.wasAlertSentToday(
            pmr.project_material_requirement_id,
            pmr.creator_id
          );

          if (alreadySent) {
            alertsSkipped++;
            continue;
          }

          const daysUntil = moment(pmr.arrived_date).diff(moment(), 'days');
          const title = `⚠️ DELAY RISK: ${pmr.material_name} - Not Yet Delivered`;
          const message = this.formatNotificationMessage(pmr, daysUntil);

          await notificationService.createNotificationForUser(
            pmr.creator_id,
            title,
            message,
            'warning',
            this.moduleId
          );

          await pmrAlertLogRepository.createAlertLog(
            pmr.project_material_requirement_id,
            pmr.creator_id,
            'pre_delay_warning'
          );

          alertsSent++;
        } catch (error) {
          console.error(
            `Failed to send alert for PMR ${pmr.project_material_requirement_id}:`,
            error.message
          );
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `PMR alert job completed in ${duration}ms: ${alertsSent} sent, ${alertsSkipped} skipped`
      );
    } catch (error) {
      console.error('PMR alert job failed:', error.message);
      throw error;
    }
  }

  formatNotificationMessage(pmr, daysUntil) {
    const arrivalDate = moment(pmr.arrived_date).format('YYYY-MM-DD');
    let urgencyMessage;

    if (daysUntil === 0) {
      urgencyMessage = `🚨 CRITICAL: The material was supposed to arrive in (${arrivalDate}) but is still NOT DELIVERED!`;
    } else if (daysUntil === 1) {
      urgencyMessage = `⚠️ URGENT: The material is scheduled to arrive in (${arrivalDate}) but is still NOT DELIVERED!`;
    } else {
      urgencyMessage = `⚠️ WARNING: The material is scheduled to arrive in ${daysUntil} days (${arrivalDate}) but is still NOT DELIVERED!`;
    }

    return (
      `${urgencyMessage} ` +
      `Material: "${pmr.material_name}" | Project: "${pmr.project_name}" | ` +
      `Current Status: ${pmr.status_name} | Supplier: ${pmr.supplier_name} | ` +
      `Quantity: ${pmr.quantity} ${pmr.unit_name || 'units'}. ` +
      `⚠️ THERE IS A HIGH POSSIBILITY OF DELAY! Please contact the supplier immediately to confirm the delivery status and take necessary action to prevent project delays.`
    );
  }
}

export default new PmrAlertJob();
