import type { IContactService } from '../interfaces/contact.interface.js';
import type { Contact, ToolResult } from '../../types/index.js';
import { mockData } from './data.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockContactService implements IContactService {
  async getContacts(userId: string): Promise<ToolResult<Contact[]>> {
    await delay(100); // Simulate network latency

    const contacts = mockData.contacts.get(userId);
    if (!contacts) {
      return { success: true, data: [] };
    }

    return { success: true, data: contacts };
  }
}

export const contactService = new MockContactService();
