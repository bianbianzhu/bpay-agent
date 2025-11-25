import { z } from 'zod';

export const validateBillerSchema = z.object({
  billerCode: z.string().describe('The BPAY biller code'),
  accountNumber: z.string().describe('The customer account number with the biller'),
  accountRef: z.string().describe('The customer reference number (CRN)'),
});

export type ValidateBillerInput = z.infer<typeof validateBillerSchema>;
