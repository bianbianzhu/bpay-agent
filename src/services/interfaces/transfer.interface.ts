import type {
  TransferResult,
  BpayPaymentResult,
  PayeeType,
  ToolResult,
} from '../../types/index.js';

export interface ITransferService {
  transferFundsDebitCardAccount(
    payerAccountUuid: string,
    payeeAccountUuid: string,
    amount: number,
    payeeType: PayeeType
  ): Promise<ToolResult<TransferResult>>;

  submitStaticCrnBpayPayment(
    debitCardAccountUuid: string,
    paymentInstrumentUuid: string,
    amount: number
  ): Promise<ToolResult<BpayPaymentResult>>;
}
