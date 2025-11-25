import { z } from 'zod';

export const payBillSchema = z.object({
  userId: z.string().describe('The user ID obtained from get_user'),
  billerCode: z.string().describe('The BPAY biller code'),
  accountNumber: z.string().describe('The customer account number with the biller'),
  accountRef: z.string().describe('The customer reference number (CRN)'),
  amount: z.number().positive().describe('The payment amount in dollars (e.g., 150.50)'),
});

export type PayBillInput = z.infer<typeof payBillSchema>;
