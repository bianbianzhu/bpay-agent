import { tool } from '@langchain/core/tools';
import { transferInternalSchema } from './schemas/transfer-internal.schema.js';
import { transferService } from '../services/index.js';

export const transferInternalTool = tool(
  async ({ userId, fromAccountId, toAccountId, amount }) => {
    const result = await transferService.transferFundsDebitCardAccount(
      userId,
      fromAccountId,
      toAccountId,
      amount,
      'INTERNAL'
    );

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to transfer funds',
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
            transfer: result.data,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'transfer_internal',
    description:
      "Transfers funds between the user's own accounts (internal transfer). Use this for moving money between accounts owned by the same user.",
    schema: transferInternalSchema,
  }
);
