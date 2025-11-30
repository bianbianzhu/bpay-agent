import { tool } from '@langchain/core/tools';
import { transferExternalSchema } from './schemas/transfer-external.schema.js';
import { transferService } from '../services/index.js';

export const transferExternalTool = tool(
  async ({ fromAccountId, paymentInstrumentId, amount }) => {
    const result = await transferService.transferFundsDebitCardAccount(
      fromAccountId,
      paymentInstrumentId,
      amount,
      'EXTERNAL'
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
    name: 'transfer_external',
    description:
      "Transfers funds to an external contact's bank account. Use this for sending money to contacts (not the user's own accounts).",
    schema: transferExternalSchema,
  }
);
