import BaseService from '../../../services/index.js';
import notificationRepository from '../../../repositories/notification/index.js';

class NotificationUIService extends BaseService {
  /**
   * Get all notifications for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of notifications
   */
  async getAllUserNotifications(userId) {
    try {
      const notifications = await notificationRepository.getAllByUserId(userId);
      return notifications;
    } catch (error) {
      throw this.handleError(error, 'Failed to get user notifications');
    }
  }

  /**
   * Get unread notifications for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Object with count and list of unread notifications
   */
  async getUnreadNotifications(userId) {
    try {
      const unreadNotifications = await notificationRepository.getUnreadByUserId(userId);
      return {
        count: unreadNotifications.length,
        notifications: unreadNotifications,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get unread notifications');
    }
  }

  /**
   * Get a single notification by ID
   * @param {number} notificationId - Notification ID
   * @returns {Promise<Object>} Notification object
   */
  async getNotificationById(notificationId) {
    try {
      const notification = await notificationRepository.getOneById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }
      return notification;
    } catch (error) {
      throw this.handleError(error, 'Failed to get notification');
    }
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>} Success status
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      // Verify the notification belongs to this user
      const notification = await this.getNotificationById(notificationId);
      if (notification.user_id !== userId) {
        throw new Error('Unauthorized: Notification does not belong to this user');
      }

      const success = await notificationRepository.markAsRead(notificationId);
      if (!success) {
        throw new Error('Failed to mark notification as read');
      }
      return true;
    } catch (error) {
      throw this.handleError(error, 'Failed to mark notification as read');
    }
  }

  /**
   * Delete (soft delete) a notification
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(notificationId, userId) {
    try {
      // Verify the notification belongs to this user
      const notification = await this.getNotificationById(notificationId);
      if (notification.user_id !== userId) {
        throw new Error('Unauthorized: Notification does not belong to this user');
      }

      const success = await notificationRepository.deleteOneById(notificationId);
      if (!success) {
        throw new Error('Failed to delete notification');
      }
      return true;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete notification');
    }
  }
}

export default new NotificationUIService();
