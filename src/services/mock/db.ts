import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { User, Contact, Account } from '../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'db.json');

// JSON-serializable structure (Maps become Record objects)
export interface DbData {
  users: Record<string, User>;
  contacts: Record<string, Contact[]>;
  accounts: Record<string, Account[]>;
}

// Default data matching the original mockData structure
const defaultData: DbData = {
  users: {
    user_001: {
      id: 'user_001',
      email: 'john.smith@example.com',
      name: 'John Smith',
      createdAt: new Date('2023-01-15'),
    },
  },
  contacts: {
    user_001: [
      {
        id: 'contact1',
        name: 'Coffee Supplier',
        contactType: 'BUSINESS',
        paymentInstruments: [
          {
            id: 'pi1',
            details: {
              __typename: 'BankAccountDetails',
              bsb: '123456',
              account: '987654321',
              name: 'Bean Supplier',
            },
          },
          {
            id: 'pi2',
            details: {
              __typename: 'PaymentInstrumentBpayStaticCrnDetails',
              billerName: 'Milk Supplier',
              billerCode: '654321',
              crn: '1234567890',
            },
          },
        ],
      },
      {
        id: 'contact2',
        name: 'Sarah Johnson',
        contactType: 'PERSON',
        paymentInstruments: [
          {
            id: 'pi3',
            details: {
              __typename: 'BankAccountDetails',
              bsb: '456789',
              account: '789012345',
              name: 'Paper Cup Supplier',
            },
          },
        ],
      },
    ],
  },
  accounts: {
    user_001: [
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
    ],
  },
};

// Custom JSON reviver to handle Date strings
function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    // Check if it looks like an ISO date string
    const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (datePattern.test(value)) {
      return new Date(value);
    }
  }
  return value;
}

export function loadData(): DbData {
  if (!existsSync(DB_PATH)) {
    // Create default db.json if it doesn't exist
    saveData(defaultData);
    return defaultData;
  }

  try {
    const raw = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw, dateReviver) as DbData;
  } catch {
    // If file is corrupted, reset to default
    saveData(defaultData);
    return defaultData;
  }
}

export function saveData(data: DbData): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Export the DB path for reference
export { DB_PATH };
