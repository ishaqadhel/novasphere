import BaseService from '../../services/index.js';
import userRepository from '../../repositories/user/index.js';
import bcrypt from 'bcrypt';

class AuthService extends BaseService {
  async login(email, password) {
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
  }

  async logout(_userId) {
    // Session destruction is handled in the controller
    return true;
  }
}

export default new AuthService();
