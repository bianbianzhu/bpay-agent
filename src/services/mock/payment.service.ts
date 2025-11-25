import type { IPaymentService } from '../interfaces/payment.interface.js';
import type { PayBillInput, PaymentResult, Payment, ToolResult } from '../../types/index.js';
import { mockData } from './data.js';

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

class MockPaymentService implements IPaymentService {
  async payBill(userId: string, input: PayBillInput): Promise<PaymentResult> {
    await delay(500); // Simulate payment processing

    // Simulate occasional failures (5% failure rate for demo)
    if (Math.random() < 0.05) {
      return {
        success: false,
        message: 'Payment processing failed. Please try again.',
        errorCode: 'PROCESSING_ERROR',
      };
    }

    // Create payment record
    const paymentId = `pay_${Date.now()}`;
    const reference = `REF${Date.now().toString(36).toUpperCase()}`;

    const payment: Payment = {
      id: paymentId,
      userId,
      billerAccountId: '', // Would be resolved in production
      amount: Math.round(input.amount * 100), // Store in cents
      currency: 'AUD',
      status: 'completed',
      reference,
      initiatedAt: new Date(),
      completedAt: new Date(),
    };

    mockData.payments.set(paymentId, payment);

    return {
      success: true,
      paymentId,
      reference,
      message: `Payment of $${input.amount.toFixed(2)} AUD processed successfully.`,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<ToolResult<{ status: string; message: string }>> {
    await delay(100);

    const payment = mockData.payments.get(paymentId);
    if (!payment) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }

    return {
      success: true,
      data: {
        status: payment.status,
        message: `Payment ${payment.reference} is ${payment.status}.`,
      },
    };
  }
}

export const paymentService = new MockPaymentService();
