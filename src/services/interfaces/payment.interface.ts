import type { PayBillInput, PaymentResult, ToolResult } from '../../types/index.js';

export interface IPaymentService {
  payBill(userId: string, input: PayBillInput): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<ToolResult<{ status: string; message: string }>>;
}
