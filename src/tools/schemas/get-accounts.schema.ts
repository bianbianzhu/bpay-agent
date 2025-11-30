import { z } from 'zod';

export const getAccountsSchema = z.object({
  userId: z.string().describe('The user ID obtained from get_user'),
});

export type GetAccountsInput = z.infer<typeof getAccountsSchema>;
