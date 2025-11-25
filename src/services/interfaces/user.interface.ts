import type { User, ToolResult } from '../../types/index.js';

export interface IUserService {
  getUserFromToken(jwtToken: string): Promise<ToolResult<User>>;
  getUserById(userId: string): Promise<ToolResult<User>>;
}
