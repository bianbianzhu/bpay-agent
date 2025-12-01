import type { ITransferService } from '../interfaces/transfer.interface.js';
import type {
  TransferResult,
  BpayPaymentResult,
  PayeeType,
  ToolResult,
  Account,
} from '../../types/index.js';
import { mockData, persistData } from './data.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockTransferService implements ITransferService {
  private getAccount(userId: string, accountId: string): Account | null {
    const accounts = mockData.accounts.get(userId);
    const account = accounts?.find(a => a.id === accountId);
    return account ?? null;
  }

  async transferFundsDebitCardAccount(
    userId: string,
    payerAccountUuid: string,
    payeeAccountUuid: string,
    amount: number,
    payeeType: PayeeType
  ): Promise<ToolResult<TransferResult>> {
    await delay(100); // Simulate network latency

    // Get account to check type and balance
    const account = this.getAccount(userId, payerAccountUuid);

    if (account === null) {
      return {
        success: false,
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Source account not found' },
      };
    }

    // Validate account type for external transfers
    if (payeeType === 'EXTERNAL' && account.type !== 'ZLR_DEBIT') {
      return {
        success: false,
        error: {
          code: 'INVALID_ACCOUNT_TYPE',
          message: 'External transfers can only be made from debit accounts',
        },
      };
    }

    if (account.balance < amount) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: `Insufficient funds. Available: $${account.balance.toFixed(2)}`,
        },
      };
    }

    // Update balances
    account.balance -= amount;

    // For internal transfers, add to destination account
    if (payeeType === 'INTERNAL') {
      const destAccount = this.getAccount(userId, payeeAccountUuid);
      if (destAccount) {
        destAccount.balance += amount;
      }
    }

    // Persist changes to JSON
    persistData();

    // Mock successful transfer
    return {
      success: true,
      data: {
        id: `transfer_${Date.now()}`,
        status: 'COMPLETED',
      },
    };
  }

  async submitStaticCrnBpayPayment(
    userId: string,
    debitCardAccountUuid: string,
    paymentInstrumentUuid: string,
    amount: number
  ): Promise<ToolResult<BpayPaymentResult>> {
    await delay(100); // Simulate network latency

    // Get account to check type and balance
    const account = this.getAccount(userId, debitCardAccountUuid);

    if (account === null) {
      return {
        success: false,
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Source account not found' },
      };
    }

    // Validate account type for BPAY payments
    if (account.type !== 'ZLR_DEBIT') {
      return {
        success: false,
        error: {
          code: 'INVALID_ACCOUNT_TYPE',
          message: 'BPAY payments can only be made from debit accounts',
        },
      };
    }

    if (account.balance < amount) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: `Insufficient funds. Available: $${account.balance.toFixed(2)}`,
        },
      };
    }

    // Update balance
    account.balance -= amount;

    // Persist changes to JSON
    persistData();

    // Mock successful BPAY payment
    return {
      success: true,
      data: {
        id: `bpay_${Date.now()}`,
        status: 'COMPLETED',
      },
    };
  }
}

export const transferService = new MockTransferService();
