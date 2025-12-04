import BaseController from '../../../controllers/index.js';
import notificationService from './service.js';
import moment from 'moment';

class NotificationController extends BaseController {
  constructor() {
    super();
    this.index = this.index.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.delete = this.delete.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
  }

  /**
   * Display all notifications for the logged-in user
   * GET /app/notification
   */
  async index(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const notifications = await notificationService.getAllUserNotifications(userId);
      const unreadData = await notificationService.getUnreadNotifications(userId);

      const formattedNotifications = this._formatNotificationData(notifications);

      return this.renderView(res, 'app/notification/home/index', {
        title: 'Notifications',
        notifications: formattedNotifications,
        hasNotifications: formattedNotifications.length > 0,
        unreadCount: unreadData.count,
        user: this.getSessionUser(req),
      });
    } catch (error) {
      return this.sendError(res, 'Failed to load notifications', 500, error);
    }
  }

  /**
   * Mark a notification as read
   * POST /app/notification/:id/mark-read
   */
  async markAsRead(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const notificationId = req.params.id;

      await notificationService.markNotificationAsRead(notificationId, userId);

      // Return updated notification row
      const notification = await notificationService.getNotificationById(notificationId);
      const formattedNotifications = this._formatNotificationData([notification]);

      return this.renderView(res, 'app/notification/home/row', formattedNotifications[0], false);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  }

  /**
   * Delete a notification (soft delete)
   * POST /app/notification/:id/delete
   */
  async delete(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const notificationId = req.params.id;

      await notificationService.deleteNotification(notificationId, userId);

      // Return empty response to remove the row
      return res.send('');
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  /**
   * Get unread notification count for badge
   * GET /app/notification/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = this.getSessionUser(req).user_id;
      const unreadData = await notificationService.getUnreadNotifications(userId);

      return res.json({ count: unreadData.count });
    } catch (error) {
      return res.status(500).json({ count: 0, error: error.message });
    }
  }

  /**
   * Format notification data with time ago, icons, and badge classes
   * @param {Array} notifications - Array of notification objects
   * @returns {Array} Formatted notification objects
   */
  _formatNotificationData(notifications) {
    return notifications.map((n) => {
      const now = moment();
      const created = moment(n.created_at);
      const diffMinutes = now.diff(created, 'minutes');
      const diffHours = now.diff(created, 'hours');
      const diffDays = now.diff(created, 'days');

      let timeAgo;
      if (diffMinutes < 1) timeAgo = 'Just now';
      else if (diffMinutes < 60) timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else if (diffDays < 7) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else timeAgo = created.format('MMM DD, YYYY');

      return {
        ...n,
        formatted_created_at: created.format('YYYY-MM-DD HH:mm:ss'),
        time_ago: timeAgo,
        badge_class: n.is_read ? 'bg-secondary' : 'bg-primary',
        read_badge_text: n.is_read ? 'Read' : 'Unread',
        type_icon: this._getNotificationIcon(n.notification_type),
        type_color: this._getNotificationColor(n.notification_type),
        row_class: n.is_read ? '' : 'table-primary',
      };
    });
  }

  /**
   * Get Bootstrap icon class based on notification type
   * @param {string} type - Notification type
   * @returns {string} Bootstrap icon class
   */
  _getNotificationIcon(type) {
    const icons = {
      info: 'bi-info-circle-fill',
      success: 'bi-check-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      error: 'bi-x-circle-fill',
    };
    return icons[type] || icons.info;
  }

  /**
   * Get Bootstrap color class based on notification type
   * @param {string} type - Notification type
   * @returns {string} Bootstrap color class
   */
  _getNotificationColor(type) {
    const colors = {
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-danger',
    };
    return colors[type] || colors.info;
  }
}

export default new NotificationController();
