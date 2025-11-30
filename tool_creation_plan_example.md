# Implementation Plan: `get_accounts` Tool

## Overview

Create a new `get_accounts` tool that retrieves user accounts, following the same patterns established for `get_contacts`.

## Files to Create/Modify

### 1. Create Account Types

**File:** `src/types/account.types.ts` (NEW)

```typescript
export type AccountType = "ZLR_DEBIT" | "SAVINGS";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}
```

### 2. Export Account Types

**File:** `src/types/index.ts` (MODIFY)

Add: `export * from './account.types.js';`

### 3. Create Account Service Interface

**File:** `src/services/interfaces/account.interface.ts` (NEW)

```typescript
import type { Account, ToolResult } from "../../types/index.js";

export interface IAccountService {
  getDebitCardAccountsV2(userId: string): Promise<ToolResult<Account[]>>;
}
```

### 4. Add Mock Account Data

**File:** `src/services/mock/data.ts` (MODIFY)

Add mock accounts data for user_001:

```typescript
accounts: new Map<string, Account[]>([
  ['user_001', [
    {
      id: 'acc1',
      name: 'Daily Expense Account',
      type: 'ZLR_DEBIT',
      balance: 500,
    },
    {
      id: 'acc2',
      name: 'Savings Account',
      type: 'SAVINGS',
      balance: 15000,
    },
  ]],
]),
```

### 5. Create Mock Account Service

**File:** `src/services/mock/account.service.ts` (NEW)

```typescript
import type { IAccountService } from "../interfaces/account.interface.js";
import type { Account, ToolResult } from "../../types/index.js";
import { mockData } from "./data.js";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

class MockAccountService implements IAccountService {
  async getDebitCardAccountsV2(userId: string): Promise<ToolResult<Account[]>> {
    await delay(100);

    const accounts = mockData.accounts.get(userId);
    if (!accounts) {
      return { success: true, data: [] };
    }

    return { success: true, data: accounts };
  }
}

export const accountService = new MockAccountService();
```

### 6. Export Account Service

**File:** `src/services/index.ts` (MODIFY)

Add:

- `export { accountService } from './mock/account.service.js';`
- `export type { IAccountService } from './interfaces/account.interface.js';`

### 7. Create Tool Schema

**File:** `src/tools/schemas/get-accounts.schema.ts` (NEW)

```typescript
import { z } from "zod";

export const getAccountsSchema = z.object({
  userId: z.string().describe("The user ID obtained from get_user"),
});

export type GetAccountsInput = z.infer<typeof getAccountsSchema>;
```

### 8. Create Tool

**File:** `src/tools/get-accounts.tool.ts` (NEW)

```typescript
import { tool } from "@langchain/core/tools";
import { getAccountsSchema } from "./schemas/get-accounts.schema.js";
import { accountService } from "../services/index.js";

export const getAccountsTool = tool(
  async ({ userId }) => {
    const result = await accountService.getDebitCardAccountsV2(userId);

    if (!result.success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: result.error?.message || "Failed to get accounts",
            }),
          },
        ],
        isError: true,
      };
    }

    const accounts = result.data || [];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            count: accounts.length,
            accounts: accounts,
          }),
        },
      ],
      isError: false,
    };
  },
  {
    name: "get_accounts",
    description:
      "Retrieves the user's bank accounts. Returns account id, name, type (ZLR_DEBIT or SAVINGS), and balance.",
    schema: getAccountsSchema,
  }
);
```

### 9. Export Tool

**File:** `src/tools/index.ts` (MODIFY)

Add import and export for `getAccountsTool` and add to `bpayTools` array.

## Implementation Order

1. `src/types/account.types.ts` - Create types
2. `src/types/index.ts` - Export types
3. `src/services/interfaces/account.interface.ts` - Create interface
4. `src/services/mock/data.ts` - Add mock data
5. `src/services/mock/account.service.ts` - Create service
6. `src/services/index.ts` - Export service
7. `src/tools/schemas/get-accounts.schema.ts` - Create schema
8. `src/tools/get-accounts.tool.ts` - Create tool
9. `src/tools/index.ts` - Export tool

## Critical Files to Reference

- `src/tools/get-contacts.tool.ts` - Recently implemented tool (same pattern)
- `src/services/mock/contact.service.ts` - Recently implemented service (same pattern)
