import bcrypt from 'bcrypt';
import BaseService from '../../../services/index.js';
import userRepository from '../../../repositories/user/index.js';
import roleRepository from '../../../repositories/role/index.js';

class UserService extends BaseService {
  constructor() {
    super();
    this.saltRounds = 10;
  }

  async getAllUsers() {
    try {
      return await userRepository.getAll();
    } catch (error) {
      throw this.handleError(error, 'Failed to get users');
    }
  }

  async getAllActiveUsers() {
    try {
      return await userRepository.getAllActive();
    } catch (error) {
      throw this.handleError(error, 'Failed to get active users');
    }
  }

  async getUserById(id) {
    try {
      const user = await userRepository.getOneById(id);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw this.handleError(error, 'Failed to get user');
    }
  }

  async getAllRoles() {
    try {
      return await roleRepository.getAll();
    } catch (error) {
      throw this.handleError(error, 'Failed to get roles');
    }
  }

  async createUser(data) {
    try {
      this.validateRequired(data, [
        'email',
        'password',
        'first_name',
        'last_name',
        'phone',
        'role_id',
      ]);

      // Check if email already exists
      const existingUser = await userRepository.getOneByEmail(data.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

      const userData = {
        ...data,
        password: hashedPassword,
      };

      return await userRepository.createOne(userData);
    } catch (error) {
      throw this.handleError(error, 'Failed to create user');
    }
  }

  async updateUser(id, data) {
    try {
      this.validateRequired(data, ['email', 'first_name', 'last_name', 'phone', 'role_id']);

      await this.getUserById(id);

      // Check if email is being changed and if it already exists
      if (data.email) {
        const existingUser = await userRepository.getOneByEmail(data.email);
        if (existingUser && existingUser.user_id !== parseInt(id)) {
          throw new Error('Email already exists');
        }
      }

      const userData = { ...data };

      // Hash password if provided
      if (data.password && data.password.trim() !== '') {
        userData.password = await bcrypt.hash(data.password, this.saltRounds);
      } else {
        // Remove password from update if not provided
        delete userData.password;
      }

      const result = await userRepository.updateOneById(id, userData);

      if (!result) {
        throw new Error('Failed to update user');
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to update user');
    }
  }

  async deleteUser(id) {
    try {
      await this.getUserById(id);

      const result = await userRepository.deleteOneById(id);

      if (!result) {
        throw new Error('Failed to delete user');
      }

      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete user');
    }
  }

  async countUsers() {
    try {
      return await userRepository.count();
    } catch (error) {
      throw this.handleError(error, 'Failed to count users');
    }
  }
}

export default new UserService();
