import { z } from 'zod';

export const transferInternalSchema = z.object({
  fromAccountId: z.string().describe('Source account ID from get_accounts'),
  toAccountId: z
    .string()
    .describe("Destination account ID from get_accounts (user's own account)"),
  amount: z.number().positive().describe('Amount to transfer'),
});

export type TransferInternalInput = z.infer<typeof transferInternalSchema>;
