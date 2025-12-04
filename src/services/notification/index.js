import notificationRepository from '../../repositories/notification/index.js';
import userRepository from '../../repositories/user/index.js';
import roleRepository from '../../repositories/role/index.js';
import moduleRepository from '../../repositories/module/index.js';
import moment from 'moment';

const MODULE_ROLE_MAP = {
  Material: ['admin'],
  'Material Category': ['admin'],
  Supplier: ['admin'],
  User: ['admin'],
  Project: ['pm'],
  'Project Task': ['pm'],
  'Project Material Requirement': ['pm', 'supervisor'],
};

const ACTION_TO_TYPE = {
  created: 'info',
  updated: 'success',
  deleted: 'warning',
};

const MODULE_MAP = {
  Material: 2,
  'Material Category': 3,
  Project: 4,
  'Project Task': 5,
  'Project Material Requirement': 6,
  Supplier: 7,
  User: 8,
};

class NotificationService {
  /**
   * Get all active users with a specific role
   * @param {string} roleName - Role name (admin, pm, supervisor)
   * @returns {Promise<Array>} Array of users
   */
  async getUsersByRole(roleName) {
    try {
      const role = await roleRepository.getOneByName(roleName);
      if (!role) {
        console.warn(`Role "${roleName}" not found`);
        return [];
      }

      const allUsers = await userRepository.getAllActive();
      return allUsers.filter((user) => user.role_id === role.role_id);
    } catch (error) {
      console.error(`Error getting users by role "${roleName}":`, error.message);
      return [];
    }
  }

  /**
   * Get module information by module ID
   * @param {number} moduleId - Module ID
   * @returns {Promise<Object|null>} Module object or null
   */
  async getModuleName(moduleId) {
    try {
      const module = await moduleRepository.getOneById(moduleId);
      return module ? module.name : null;
    } catch (error) {
      console.error(`Error getting module by ID ${moduleId}:`, error.message);
      return null;
    }
  }

  /**
   * Create a notification for a specific user
   * @param {number} userId - User ID to receive notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {number|null} moduleId - Module ID (optional)
   * @returns {Promise<number|null>} Notification ID or null
   */
  async createNotificationForUser(userId, title, message, type, moduleId = null) {
    try {
      const notificationData = {
        user_id: userId,
        title,
        message,
        notification_type: type,
        module_id: moduleId,
        is_active: true,
      };

      const notificationId = await notificationRepository.createOne(notificationData);
      return notificationId;
    } catch (error) {
      console.error(`Error creating notification for user ${userId}:`, error.message);
      return null;
    }
  }

  /**
   * Create notifications for all users with specific roles
   * @param {Array<string>} roleNames - Array of role names
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number|null} moduleId - Module ID
   * @param {number} excludeUserId - User ID to exclude (the actor)
   * @returns {Promise<Array<number>>} Array of created notification IDs
   */
  async createNotificationsForRoles(roleNames, title, message, type, moduleId, excludeUserId) {
    const notificationIds = [];

    for (const roleName of roleNames) {
      const users = await this.getUsersByRole(roleName);
      const recipients = users.filter((u) => u.user_id !== excludeUserId);

      for (const user of recipients) {
        const notificationId = await this.createNotificationForUser(
          user.user_id,
          title,
          message,
          type,
          moduleId
        );
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }
    }

    return notificationIds;
  }

  /**
   * Main method: Create notifications based on CRUD action on a module
   * @param {string} action - Action performed (created, updated, deleted)
   * @param {string} moduleName - Module name (e.g., "Supplier", "Project")
   * @param {string} itemName - Name of the item that was modified
   * @param {number} actorUserId - User ID who performed the action
   * @param {string} actorUserName - Full name of the user who performed the action
   * @returns {Promise<void>}
   */
  async notifyOnCRUD(action, moduleName, itemName, actorUserId, actorUserName) {
    try {
      // Check if this module should trigger notifications
      if (!MODULE_ROLE_MAP[moduleName]) {
        console.log(`No notification rules for module: ${moduleName}`);
        return;
      }

      // Get module ID
      const moduleId = MODULE_MAP[moduleName];
      if (!moduleId) {
        console.warn(`Module ID not found for: ${moduleName}`);
        return;
      }

      // Get roles that should be notified
      const roleNames = MODULE_ROLE_MAP[moduleName];

      // Determine notification type based on action
      const notificationType = ACTION_TO_TYPE[action] || 'info';

      // Format action verb (created/updated/deleted)
      const actionPastTense = action;

      // Format title: "[Module] [Action] by [User Name]"
      const title = `${moduleName} ${this._capitalizeFirstLetter(actionPastTense)} by ${actorUserName}`;

      // Format message: "[Module] "[item name]" has been [created/updated/deleted] by [user name] at [time]"
      const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
      const message = `${moduleName} "${itemName}" has been ${actionPastTense} by ${actorUserName} at ${timestamp}`;

      // Create notifications for all users with the specified roles (excluding the actor)
      const notificationIds = await this.createNotificationsForRoles(
        roleNames,
        title,
        message,
        notificationType,
        moduleId,
        actorUserId
      );

      console.log(
        `Created ${notificationIds.length} notification(s) for ${moduleName} ${actionPastTense}`
      );
    } catch (error) {
      console.error(`Error in notifyOnCRUD for ${moduleName}:`, error.message);
    }
  }

  /**
   * Helper: Capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  _capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default new NotificationService();
