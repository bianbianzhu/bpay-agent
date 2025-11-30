import { tool } from '@langchain/core/tools';
import { getContactsSchema } from './schemas/get-contacts.schema.js';
import { contactService } from '../services/index.js';

export const getContactsTool = tool(
  async ({ userId }) => {
    const result = await contactService.getContacts(userId);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error?.message || 'Failed to get contacts',
            }),
          },
        ],
        isError: true,
      };
    }

    const contacts = result.data || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: contacts.length,
            contacts: contacts,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: 'get_contacts',
    description:
      "Retrieves the user's saved contacts. Each contact has payment instruments that can be bank accounts or BPAY details.",
    schema: getContactsSchema,
  }
);
