import { tool } from '@langchain/core/tools';
import { validateBillerSchema } from './schemas/validate-biller.schema.js';
import { billerService } from '../services/index.js';

export const validateBillerTool = tool(
  async ({ billerCode, accountNumber, accountRef }) => {
    const result = await billerService.validateBiller(
      billerCode,
      accountNumber,
      accountRef
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isValid: result.isValid,
            billerName: result.billerName,
            accountStatus: result.accountStatus,
            errorMessage: result.errorMessage,
          }),
        },
      ],
      isError: !result.isValid,
    };
  },
  {
    name: 'validate_biller_account',
    description:
      'Validates a biller account by checking if the biller code, account number, and customer reference number (CRN) are valid. ALWAYS call this before making a payment to ensure the biller details are correct.',
    schema: validateBillerSchema,
  }
);
