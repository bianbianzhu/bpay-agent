export enum ErrorCode {
  // Authentication errors
  INVALID_JWT = 'INVALID_JWT',
  EXPIRED_JWT = 'EXPIRED_JWT',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Biller errors
  BILLER_NOT_FOUND = 'BILLER_NOT_FOUND',
  INVALID_BILLER_CODE = 'INVALID_BILLER_CODE',
  INVALID_ACCOUNT_NUMBER = 'INVALID_ACCOUNT_NUMBER',
  INVALID_CRN = 'INVALID_CRN',
  BILLER_VALIDATION_FAILED = 'BILLER_VALIDATION_FAILED',

  // Payment errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_LIMIT_EXCEEDED = 'PAYMENT_LIMIT_EXCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',

  // System errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

const USER_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_JWT]: 'Your session has expired. Please log in again.',
  [ErrorCode.EXPIRED_JWT]: 'Your session has expired. Please log in again.',
  [ErrorCode.USER_NOT_FOUND]: 'Unable to find your account. Please contact support.',
  [ErrorCode.BILLER_NOT_FOUND]: 'The requested biller could not be found.',
  [ErrorCode.INVALID_BILLER_CODE]: 'The biller code is invalid. Please check and try again.',
  [ErrorCode.INVALID_ACCOUNT_NUMBER]: 'The account number is invalid.',
  [ErrorCode.INVALID_CRN]: 'The customer reference number (CRN) is invalid.',
  [ErrorCode.BILLER_VALIDATION_FAILED]: 'Unable to validate the biller details.',
  [ErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds for this payment.',
  [ErrorCode.PAYMENT_LIMIT_EXCEEDED]: 'This payment exceeds your daily limit.',
  [ErrorCode.PAYMENT_FAILED]: 'The payment could not be processed. Please try again.',
  [ErrorCode.DUPLICATE_PAYMENT]: 'A similar payment was recently made. Please confirm this is not a duplicate.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The payment service is temporarily unavailable.',
  [ErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

export class TransferError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: Record<string, unknown>
  ) {
    super(message || USER_MESSAGES[code]);
    this.name = 'TransferError';
  }

  toUserMessage(): string {
    return USER_MESSAGES[this.code] || this.message;
  }

  toToolResult(): { error: { code: string; message: string } } {
    return {
      error: {
        code: this.code,
        message: this.toUserMessage(),
      },
    };
  }
}
