import { z } from 'zod';

export const transferExternalSchema = z.object({
  userId: z.string().describe('User ID from pre-loaded context'),
  fromAccountId: z.string().describe('Source account ID from get_accounts'),
  paymentInstrumentId: z
    .string()
    .describe("Payment instrument ID from contact's paymentInstruments"),
  amount: z.number().positive().describe('Amount to transfer'),
});

export type TransferExternalInput = z.infer<typeof transferExternalSchema>;
