import type { Contact, ToolResult } from '../../types/index.js';

export interface IContactService {
  getContacts(userId: string): Promise<ToolResult<Contact[]>>;
}
