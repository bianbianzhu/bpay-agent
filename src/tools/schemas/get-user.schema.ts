import { z } from 'zod';

export const getUserSchema = z.object({
  jwtToken: z.string().describe('The JWT token from the user session'),
});

export type GetUserInput = z.infer<typeof getUserSchema>;
