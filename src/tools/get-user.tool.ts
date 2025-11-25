import { DynamicStructuredTool } from '@langchain/core/tools';
import { getUserSchema } from './schemas/get-user.schema.js';
import { userService } from '../services/index.js';

export const getUserTool = new DynamicStructuredTool({
  name: 'get_user',
  description: 'Retrieves the current user information from a JWT token. ALWAYS call this first at the start of any conversation to get the user_id for subsequent operations.',
  schema: getUserSchema,
  func: async ({ jwtToken }) => {
    const result = await userService.getUserFromToken(jwtToken);

    if (!result.success) {
      return JSON.stringify({
        success: false,
        error: result.error?.message || 'Failed to get user',
      });
    }

    return JSON.stringify({
      success: true,
      userId: result.data?.id,
      userName: result.data?.name,
      email: result.data?.email,
    });
  },
});
