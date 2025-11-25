import type { User, BillerAccount, Payment } from '../../types/index.js';

// In-memory mock data store
export const mockData = {
  users: new Map<string, User>([
    ['user_001', {
      id: 'user_001',
      email: 'john.smith@example.com',
      name: 'John Smith',
      createdAt: new Date('2023-01-15'),
    }],
    ['user_002', {
      id: 'user_002',
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      createdAt: new Date('2023-03-20'),
    }],
  ]),

  billerAccounts: new Map<string, BillerAccount>([
    ['biller_001', {
      id: 'biller_001',
      userId: 'user_001',
      billerCode: '23796',
      billerName: 'Sydney Water',
      accountNumber: '123456789',
      accountRef: '987654321',
      nickname: 'Home Water',
      category: 'utilities',
      isActive: true,
      createdAt: new Date('2023-02-01'),
      lastPaidAt: new Date('2024-01-15'),
    }],
    ['biller_002', {
      id: 'biller_002',
      userId: 'user_001',
      billerCode: '12345',
      billerName: 'AGL Energy',
      accountNumber: '111222333',
      accountRef: '444555666',
      nickname: 'Electricity',
      category: 'utilities',
      isActive: true,
      createdAt: new Date('2023-02-01'),
    }],
    ['biller_003', {
      id: 'biller_003',
      userId: 'user_001',
      billerCode: '54321',
      billerName: 'Telstra',
      accountNumber: '777888999',
      accountRef: '000111222',
      category: 'telecom',
      isActive: true,
      createdAt: new Date('2023-03-01'),
    }],
    ['biller_004', {
      id: 'biller_004',
      userId: 'user_001',
      billerCode: '67890',
      billerName: 'Origin Gas',
      accountNumber: '333444555',
      accountRef: '666777888',
      nickname: 'Gas Bill',
      category: 'utilities',
      isActive: true,
      createdAt: new Date('2023-04-01'),
    }],
  ]),

  payments: new Map<string, Payment>(),

  // Valid biller codes for validation
  validBillerCodes: new Set(['23796', '12345', '54321', '67890', '11111', '99999']),
};

// JWT token mapping (mock)
export const jwtUserMapping: Record<string, string> = {
  'mock_jwt_token_001': 'user_001',
  'mock_jwt_token_002': 'user_002',
};

// Biller code to name mapping for validation
export const billerCodeNames: Record<string, string> = {
  '23796': 'Sydney Water',
  '12345': 'AGL Energy',
  '54321': 'Telstra',
  '67890': 'Origin Energy',
  '11111': 'Optus',
  '99999': 'Test Biller',
};
