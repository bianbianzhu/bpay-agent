export type AccountType = 'ZLR_DEBIT' | 'SAVINGS';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}
