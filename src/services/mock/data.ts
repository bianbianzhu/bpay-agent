import type { User, Contact, Account } from '../../types/index.js';
import { loadData, saveData, type DbData } from './db.js';

// Load data from JSON file
const dbData = loadData();

// Convert Record objects to Maps for compatibility with existing code
function recordToMap<T>(record: Record<string, T>): Map<string, T> {
  return new Map(Object.entries(record));
}

// In-memory mock data store (loaded from JSON)
export const mockData = {
  users: recordToMap<User>(dbData.users),
  contacts: recordToMap<Contact[]>(dbData.contacts),
  accounts: recordToMap<Account[]>(dbData.accounts),
};

// Helper to persist current mockData state to JSON
export function persistData(): void {
  const data: DbData = {
    users: Object.fromEntries(mockData.users),
    contacts: Object.fromEntries(mockData.contacts),
    accounts: Object.fromEntries(mockData.accounts),
  };
  saveData(data);
}

// JWT token mapping (mock)
export const jwtUserMapping: Record<string, string> = {
  'mock_jwt_token_001': 'user_001',
};
