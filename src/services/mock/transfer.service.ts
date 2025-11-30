import type { ITransferService } from '../interfaces/transfer.interface.js';
import type {
  TransferResult,
  BpayPaymentResult,
  PayeeType,
  ToolResult,
} from '../../types/index.js';
import { mockData } from './data.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockTransferService implements ITransferService {
  private getAccountBalance(userId: string, accountId: string): number | null {
    const accounts = mockData.accounts.get(userId);
    const account = accounts?.find(a => a.id === accountId);
    return account?.balance ?? null;
  }

  async transferFundsDebitCardAccount(
    userId: string,
    payerAccountUuid: string,
    payeeAccountUuid: string,
    amount: number,
    payeeType: PayeeType
  ): Promise<ToolResult<TransferResult>> {
    await delay(100); // Simulate network latency

    // Check balance
    const balance = this.getAccountBalance(userId, payerAccountUuid);

    if (balance === null) {
      return {
        success: false,
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Source account not found' },
      };
    }

    if (balance < amount) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: `Insufficient funds. Available: $${balance.toFixed(2)}`,
        },
      };
    }

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

    // Check balance
    const balance = this.getAccountBalance(userId, debitCardAccountUuid);

    if (balance === null) {
      return {
        success: false,
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Source account not found' },
      };
    }

    if (balance < amount) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: `Insufficient funds. Available: $${balance.toFixed(2)}`,
        },
      };
    }

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
