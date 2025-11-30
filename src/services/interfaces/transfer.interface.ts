import type {
  TransferResult,
  BpayPaymentResult,
  PayeeType,
  ToolResult,
} from '../../types/index.js';

export interface ITransferService {
  transferFundsDebitCardAccount(
    userId: string,
    payerAccountUuid: string,
    payeeAccountUuid: string,
    amount: number,
    payeeType: PayeeType
  ): Promise<ToolResult<TransferResult>>;

  submitStaticCrnBpayPayment(
    userId: string,
    debitCardAccountUuid: string,
    paymentInstrumentUuid: string,
    amount: number
  ): Promise<ToolResult<BpayPaymentResult>>;
}
