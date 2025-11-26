import { tool } from '@langchain/core/tools';
import { createBillerSchema } from './schemas/create-biller.schema.js';
import { billerService } from '../services/index.js';

export const createBillerTool = tool(
  async ({
    userId,
    billerCode,
    billerName,
    accountNumber,
    accountRef,
    nickname,
    category,
  }) => {
    const result = await billerService.createBiller(userId, {
      billerCode,
      billerName,
      accountNumber,
      accountRef,
      nickname: nickname ?? undefined,
      category,
    });

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to create biller',
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
            message: `Successfully added ${billerName} to your saved billers.`,
            billerId: result.data?.id,
            billerDetails: {
              billerCode: result.data?.billerCode,
              billerName: result.data?.billerName,
              accountNumber: result.data?.accountNumber,
              accountRef: result.data?.accountRef,
            },
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'create_biller_account',
    description:
      'Creates a new saved biller account for the user. Use this when the user wants to add a new biller that is not in their saved list. The user must provide the biller code, name, account number, CRN, and category.',
    schema: createBillerSchema,
  }
);
