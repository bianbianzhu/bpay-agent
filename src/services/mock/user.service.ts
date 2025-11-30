import type { IUserService } from '../interfaces/user.interface.js';
import type { User, ToolResult } from '../../types/index.js';
import { mockData, jwtUserMapping } from './data.js';
import { TransferError, ErrorCode } from '../../utils/errors.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockUserService implements IUserService {
  async getUserFromToken(jwtToken: string): Promise<ToolResult<User>> {
    await delay(100); // Simulate network latency

    const userId = jwtUserMapping[jwtToken];
    if (!userId) {
      const error = new TransferError(ErrorCode.INVALID_JWT);
      return {
        success: false,
        error: { code: error.code, message: error.toUserMessage() },
      };
    }

    return this.getUserById(userId);
  }

  async getUserById(userId: string): Promise<ToolResult<User>> {
    await delay(50);

    const user = mockData.users.get(userId);
    if (!user) {
      const error = new TransferError(ErrorCode.USER_NOT_FOUND);
      return {
        success: false,
        error: { code: error.code, message: error.toUserMessage() },
      };
    }

    return { success: true, data: user };
  }
}

export const userService = new MockUserService();
