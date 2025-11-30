export type PayeeType = 'INTERNAL' | 'EXTERNAL';

export interface TransferResult {
  id: string;
  status: string;
}

export interface BpayPaymentResult {
  id: string;
  status: string;
}
