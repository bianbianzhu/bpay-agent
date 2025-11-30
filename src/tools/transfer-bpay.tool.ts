import { tool } from '@langchain/core/tools';
import { transferBpaySchema } from './schemas/transfer-bpay.schema.js';
import { transferService } from '../services/index.js';

export const transferBpayTool = tool(
  async ({ userId, fromAccountId, paymentInstrumentId, amount }) => {
    const result = await transferService.submitStaticCrnBpayPayment(
      userId,
      fromAccountId,
      paymentInstrumentId,
      amount
    );

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to submit BPAY payment',
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
            payment: result.data,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'transfer_bpay',
    description:
      "Makes a BPAY payment to a biller. Use this for paying bills via the BPAY system using the contact's BPAY payment instrument.",
    schema: transferBpaySchema,
  }
);
