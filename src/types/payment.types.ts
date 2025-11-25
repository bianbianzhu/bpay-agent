export interface Payment {
  id: string;
  userId: string;
  billerAccountId: string;
  amount: number;            // in cents
  currency: 'AUD';
  status: PaymentStatus;
  reference: string;         // Transaction reference
  initiatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  reference?: string;
  message: string;
  errorCode?: string;
}

export interface PayBillInput {
  billerCode: string;
  accountNumber: string;
  accountRef: string;
  amount: number;            // in dollars
}
