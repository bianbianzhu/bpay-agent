import type {
  BillerAccount,
  BillerValidationResult,
  CreateBillerAccountInput,
  ToolResult,
} from '../../types/index.js';

export interface GetBillersFilter {
  nameFilter?: string;
  category?: string;
}

export interface IBillerService {
  getSavedBillers(
    userId: string,
    filters?: GetBillersFilter
  ): Promise<ToolResult<BillerAccount[]>>;

  validateBiller(
    billerCode: string,
    accountNumber: string,
    accountRef: string
  ): Promise<BillerValidationResult>;

  createBiller(
    userId: string,
    input: CreateBillerAccountInput
  ): Promise<ToolResult<BillerAccount>>;
}
