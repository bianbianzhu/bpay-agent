import { z } from 'zod';

export const transferBpaySchema = z.object({
  userId: z.string().describe('User ID from pre-loaded context'),
  fromAccountId: z.string().describe('Source account ID from get_accounts'),
  paymentInstrumentId: z
    .string()
    .describe("BPAY payment instrument ID from contact's paymentInstruments"),
  amount: z.number().positive().describe('Amount to pay'),
});

export type TransferBpayInput = z.infer<typeof transferBpaySchema>;
