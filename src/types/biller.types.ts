export interface BillerAccount {
  id: string;
  userId: string;
  billerCode: string;        // BPAY biller code
  billerName: string;        // e.g., "Sydney Water", "AGL Energy"
  accountNumber: string;     // Customer's account number with biller
  accountRef: string;        // Customer reference number (CRN)
  nickname?: string;         // User-defined nickname
  category: BillerCategory;
  isActive: boolean;
  createdAt: Date;
  lastPaidAt?: Date;
}

export type BillerCategory =
  | 'utilities'      // water, electricity, gas
  | 'telecom'        // phone, internet
  | 'insurance'
  | 'council'        // council rates
  | 'government'
  | 'other';

export interface BillerValidationResult {
  isValid: boolean;
  billerName?: string;
  accountStatus?: 'active' | 'inactive' | 'unknown';
  errorMessage?: string;
}

export interface CreateBillerAccountInput {
  billerCode: string;
  billerName: string;
  accountNumber: string;
  accountRef: string;
  nickname?: string;
  category: BillerCategory;
}
