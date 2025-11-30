import type { ITransferService } from '../interfaces/transfer.interface.js';
import type {
  TransferResult,
  BpayPaymentResult,
  PayeeType,
  ToolResult,
} from '../../types/index.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockTransferService implements ITransferService {
  async transferFundsDebitCardAccount(
    payerAccountUuid: string,
    payeeAccountUuid: string,
    amount: number,
    payeeType: PayeeType
  ): Promise<ToolResult<TransferResult>> {
    await delay(100); // Simulate network latency

    // Mock successful transfer
    return {
      success: true,
      data: {
        id: 'transferId1',
        status: 'COMPLETED',
      },
    };
  }

  async submitStaticCrnBpayPayment(
    debitCardAccountUuid: string,
    paymentInstrumentUuid: string,
    amount: number
  ): Promise<ToolResult<BpayPaymentResult>> {
    await delay(100); // Simulate network latency

    // Mock successful BPAY payment
    return {
      success: true,
      data: {
        id: 'transferId2',
        status: 'COMPLETED',
      },
    };
  }
}

export const transferService = new MockTransferService();
