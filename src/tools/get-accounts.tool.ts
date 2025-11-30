import { tool } from '@langchain/core/tools';
import { getAccountsSchema } from './schemas/get-accounts.schema.js';
import { accountService } from '../services/index.js';

export const getAccountsTool = tool(
  async ({ userId }) => {
    const result = await accountService.getDebitCardAccountsV2(userId);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to get accounts',
            }),
          },
        ],
        isError: true,
      };
    }

    const accounts = result.data || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: accounts.length,
            accounts: accounts,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'get_accounts',
    description:
      "Retrieves the user's bank accounts. Returns account id, name, type (ZLR_DEBIT or SAVINGS), and balance.",
    schema: getAccountsSchema,
  }
);
