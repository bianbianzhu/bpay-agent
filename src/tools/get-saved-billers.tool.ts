import { tool } from '@langchain/core/tools';
import { getSavedBillersSchema } from './schemas/get-saved-billers.schema.js';
import { billerService } from '../services/index.js';

export const getSavedBillersTool = tool(
  async ({ userId, nameFilter, category }) => {
    const result = await billerService.getSavedBillers(userId, {
      nameFilter: nameFilter ?? undefined,
      category: category ?? undefined,
    });

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to get billers',
            }),
          },
        ],
        isError: true,
      };
    }

    const billers = result.data || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: billers.length,
            billers: billers.map((b) => ({
              id: b.id,
              billerCode: b.billerCode,
              billerName: b.billerName,
              accountNumber: b.accountNumber,
              accountRef: b.accountRef,
              nickname: b.nickname,
              category: b.category,
              lastPaidAt: b.lastPaidAt?.toISOString(),
            })),
            message:
              billers.length === 0
                ? 'No matching billers found. Ask the user if they want to add a new biller or try a different search term.'
                : undefined,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'get_saved_biller_accounts',
    description:
      "Retrieves the user's saved biller accounts. Can optionally filter by name/nickname or category. Returns a list of biller accounts with their details including billerCode, accountNumber, and accountRef needed for payments.",
    schema: getSavedBillersSchema,
  }
);
