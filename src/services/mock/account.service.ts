import type { IAccountService } from '../interfaces/account.interface.js';
import type { Account, ToolResult } from '../../types/index.js';
import { mockData } from './data.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockAccountService implements IAccountService {
  async getDebitCardAccountsV2(userId: string): Promise<ToolResult<Account[]>> {
    await delay(100); // Simulate network latency

    const accounts = mockData.accounts.get(userId);
    if (!accounts) {
      return { success: true, data: [] };
    }

    return { success: true, data: accounts };
  }
}

export const accountService = new MockAccountService();
