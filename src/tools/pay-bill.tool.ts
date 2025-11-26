import { tool } from '@langchain/core/tools';
import { payBillSchema } from './schemas/pay-bill.schema.js';
import { paymentService } from '../services/index.js';

export const payBillTool = tool(
  async ({ userId, billerCode, accountNumber, accountRef, amount }) => {
    const result = await paymentService.payBill(userId, {
      billerCode,
      accountNumber,
      accountRef,
      amount,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            paymentId: result.paymentId,
            reference: result.reference,
            message: result.message,
            errorCode: result.errorCode,
          }),
        },
      ],
      isError: !result.success,
    };
  },
  {
    name: 'pay_bill',
    description:
      'Processes a BPAY bill payment. Requires the biller code, account number, customer reference number (CRN), and payment amount. IMPORTANT: Always validate the biller account with validate_biller_account AND get user confirmation before calling this tool.',
    schema: payBillSchema,
  }
);
