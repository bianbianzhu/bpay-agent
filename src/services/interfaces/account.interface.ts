import type { Account, ToolResult } from '../../types/index.js';

export interface IAccountService {
  getDebitCardAccountsV2(userId: string): Promise<ToolResult<Account[]>>;
}
