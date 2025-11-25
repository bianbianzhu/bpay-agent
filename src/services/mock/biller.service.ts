import type { IBillerService, GetBillersFilter } from '../interfaces/biller.interface.js';
import type {
  BillerAccount,
  BillerValidationResult,
  CreateBillerAccountInput,
  ToolResult,
} from '../../types/index.js';
import { mockData, billerCodeNames } from './data.js';
import { BPAYError, ErrorCode } from '../../utils/errors.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockBillerService implements IBillerService {
  async getSavedBillers(
    userId: string,
    filters?: GetBillersFilter
  ): Promise<ToolResult<BillerAccount[]>> {
    await delay(150);

    const userBillers = Array.from(mockData.billerAccounts.values())
      .filter(b => b.userId === userId && b.isActive);

    let filtered = userBillers;

    if (filters?.nameFilter) {
      const searchTerm = filters.nameFilter.toLowerCase();
      filtered = filtered.filter(b =>
        b.billerName.toLowerCase().includes(searchTerm) ||
        b.nickname?.toLowerCase().includes(searchTerm) ||
        b.category.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.category) {
      filtered = filtered.filter(b => b.category === filters.category);
    }

    return { success: true, data: filtered };
  }

  async validateBiller(
    billerCode: string,
    accountNumber: string,
    accountRef: string
  ): Promise<BillerValidationResult> {
    await delay(200);

    // Check if biller code is valid
    if (!mockData.validBillerCodes.has(billerCode)) {
      return {
        isValid: false,
        errorMessage: 'Invalid biller code. Please check and try again.',
      };
    }

    // Simulate account validation
    if (accountNumber.length < 6) {
      return {
        isValid: false,
        errorMessage: 'Account number must be at least 6 digits.',
      };
    }

    if (accountRef.length < 4) {
      return {
        isValid: false,
        errorMessage: 'Customer reference number must be at least 4 digits.',
      };
    }

    return {
      isValid: true,
      billerName: billerCodeNames[billerCode] || 'Unknown Biller',
      accountStatus: 'active',
    };
  }

  async createBiller(
    userId: string,
    input: CreateBillerAccountInput
  ): Promise<ToolResult<BillerAccount>> {
    await delay(100);

    // Validate biller code first
    if (!mockData.validBillerCodes.has(input.billerCode)) {
      const error = new BPAYError(ErrorCode.INVALID_BILLER_CODE);
      return {
        success: false,
        error: { code: error.code, message: error.toUserMessage() },
      };
    }

    const newBiller: BillerAccount = {
      id: `biller_${Date.now()}`,
      userId,
      billerCode: input.billerCode,
      billerName: input.billerName,
      accountNumber: input.accountNumber,
      accountRef: input.accountRef,
      nickname: input.nickname,
      category: input.category,
      isActive: true,
      createdAt: new Date(),
    };

    mockData.billerAccounts.set(newBiller.id, newBiller);

    return { success: true, data: newBiller };
  }
}

export const billerService = new MockBillerService();
