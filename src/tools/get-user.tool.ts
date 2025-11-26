import { tool } from '@langchain/core/tools';
import { getUserSchema } from './schemas/get-user.schema.js';
import { userService } from '../services/index.js';

export const getUserTool = tool(
  async ({ jwtToken }) => {
    const result = await userService.getUserFromToken(jwtToken);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to get user',
            }),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            userId: result.data?.id,
            userName: result.data?.name,
            email: result.data?.email,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'get_user',
    description:
      'Retrieves the current user information from a JWT token. ALWAYS call this first at the start of any conversation to get the user_id for subsequent operations.',
    schema: getUserSchema,
  }
);
