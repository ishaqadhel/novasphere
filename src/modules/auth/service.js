import BaseService from '../../services/index.js';
import userRepository from '../../repositories/user/index.js';
import bcrypt from 'bcrypt';

class AuthService extends BaseService {
  async login(email, password) {
    try {
      this.validateRequired({ email, password }, ['email', 'password']);

      const user = await userRepository.getOneByEmail(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('User account is inactive');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      await userRepository.updateLastLoginById(user.user_id);

      // Remove password from user object
      delete user.password;

      return user;
    } catch (error) {
      throw error;
    }
  }

  async logout(userId) {
    try {
      return true;
    } catch (error) {
      this.handleError(error, 'Logout failed');
    }
  }
}

export default new AuthService();
