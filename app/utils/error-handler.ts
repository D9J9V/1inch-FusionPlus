export enum ErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  CHAIN_MISMATCH = 'CHAIN_MISMATCH',
  
  // Transaction Errors
  TX_FAILED = 'TX_FAILED',
  TX_REVERTED = 'TX_REVERTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  
  // HTLC Errors
  HTLC_EXPIRED = 'HTLC_EXPIRED',
  HTLC_ALREADY_EXISTS = 'HTLC_ALREADY_EXISTS',
  HTLC_NOT_FOUND = 'HTLC_NOT_FOUND',
  INVALID_SECRET = 'INVALID_SECRET',
  
  // Bitcoin Errors
  BITCOIN_NODE_ERROR = 'BITCOIN_NODE_ERROR',
  INVALID_BITCOIN_ADDRESS = 'INVALID_BITCOIN_ADDRESS',
  UTXO_NOT_FOUND = 'UTXO_NOT_FOUND',
  BITCOIN_TX_FAILED = 'BITCOIN_TX_FAILED',
  
  // Lightning Errors
  LIGHTNING_NODE_ERROR = 'LIGHTNING_NODE_ERROR',
  INVOICE_EXPIRED = 'INVOICE_EXPIRED',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  LIGHTNING_PAYMENT_FAILED = 'LIGHTNING_PAYMENT_FAILED',
  
  // State Machine Errors
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  SWAP_TIMEOUT = 'SWAP_TIMEOUT',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

export interface SwapError {
  code: ErrorCode;
  message: string;
  details?: any;
  userMessage: string;
  recoverable: boolean;
}

export class SwapErrorHandler {
  static getUserFriendlyMessage(error: any): string {
    // Check if it's already a SwapError
    if (error.userMessage) {
      return error.userMessage;
    }
    
    // Parse error message
    const errorMessage = error.message || error.toString();
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    // Transaction errors
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds in your wallet. Please add more funds and try again.';
    }
    
    if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
      return 'Transaction was cancelled. Please try again when ready.';
    }
    
    if (errorMessage.includes('gas')) {
      return 'Gas estimation failed. The network might be congested. Please try again later.';
    }
    
    // HTLC errors
    if (errorMessage.includes('expired')) {
      return 'The swap has expired. Please create a new swap.';
    }
    
    if (errorMessage.includes('already exists')) {
      return 'A swap with this ID already exists. Please use a different transaction.';
    }
    
    // Bitcoin errors
    if (errorMessage.includes('invalid address')) {
      return 'Invalid Bitcoin address. Please check and enter a valid address.';
    }
    
    if (errorMessage.includes('UTXO')) {
      return 'No Bitcoin funds available. Please ensure the resolver has sufficient Bitcoin balance.';
    }
    
    // Lightning errors
    if (errorMessage.includes('invoice')) {
      return 'Lightning invoice issue. Please generate a new invoice and try again.';
    }
    
    // Default message
    return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  }
  
  static createError(code: ErrorCode, message: string, details?: any): SwapError {
    const userMessage = this.getUserFriendlyMessage({ message });
    const recoverable = this.isRecoverable(code);
    
    return {
      code,
      message,
      details,
      userMessage,
      recoverable
    };
  }
  
  static isRecoverable(code: ErrorCode): boolean {
    const nonRecoverableErrors = [
      ErrorCode.HTLC_EXPIRED,
      ErrorCode.INVALID_SECRET,
      ErrorCode.INVOICE_ALREADY_PAID,
      ErrorCode.AUTH_ERROR
    ];
    
    return !nonRecoverableErrors.includes(code);
  }
  
  static async handleApiError(response: Response): Promise<never> {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    if (response.status === 429) {
      throw this.createError(
        ErrorCode.RATE_LIMIT_ERROR,
        'Rate limit exceeded',
        errorData
      );
    }
    
    if (response.status === 401 || response.status === 403) {
      throw this.createError(
        ErrorCode.AUTH_ERROR,
        'Authentication failed',
        errorData
      );
    }
    
    if (response.status === 400) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        errorData.message || 'Validation error',
        errorData
      );
    }
    
    throw this.createError(
      ErrorCode.NETWORK_ERROR,
      errorData.message || 'API request failed',
      errorData
    );
  }
  
  static logError(error: SwapError | Error, context?: any): void {
    console.error('Swap Error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      context
    });
    
    // In production, send to error tracking service
    // sendToErrorTracking(error, context);
  }
}