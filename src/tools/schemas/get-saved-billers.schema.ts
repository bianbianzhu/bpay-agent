import { z } from 'zod';

export const getSavedBillersSchema = z.object({
  userId: z.string().describe('The user ID obtained from get_user'),
  nameFilter: z.string().nullable().optional().describe('Optional filter to search billers by name, nickname, or category (case-insensitive partial match). For example, "water" will match "Sydney Water"'),
  category: z.enum(['utilities', 'telecom', 'insurance', 'council', 'government', 'other']).nullable().optional().describe('Optional category filter'),
});

export type GetSavedBillersInput = z.infer<typeof getSavedBillersSchema>;
