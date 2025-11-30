import { z } from 'zod';

export const getContactsSchema = z.object({
  userId: z.string().describe('The user ID obtained from get_user'),
});

export type GetContactsInput = z.infer<typeof getContactsSchema>;
