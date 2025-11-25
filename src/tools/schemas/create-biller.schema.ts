import { z } from 'zod';

export const createBillerSchema = z.object({
  userId: z.string().describe('The user ID obtained from get_user'),
  billerCode: z.string().describe('The BPAY biller code'),
  billerName: z.string().describe('The name of the biller (e.g., "Sydney Water")'),
  accountNumber: z.string().describe('The customer account number with the biller'),
  accountRef: z.string().describe('The customer reference number (CRN)'),
  nickname: z.string().nullable().optional().describe('Optional nickname for the biller'),
  category: z.enum(['utilities', 'telecom', 'insurance', 'council', 'government', 'other']).describe('The category of the biller'),
});

export type CreateBillerInput = z.infer<typeof createBillerSchema>;
