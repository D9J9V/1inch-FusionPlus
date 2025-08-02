import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { SwapError } from '@/utils/error-handler';

interface ErrorDisplayProps {
  error: SwapError | Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export default function ErrorDisplay({ error, onRetry, onGoHome }: ErrorDisplayProps) {
  const getErrorMessage = (): string => {
    if (typeof error === 'string') return error;
    if ('userMessage' in error) return error.userMessage;
    if ('message' in error) return error.message;
    return 'An unexpected error occurred';
  };

  const isRecoverable = (): boolean => {
    if (typeof error !== 'object') return true;
    if ('recoverable' in error) return error.recoverable;
    return true;
  };

  const errorMessage = getErrorMessage();
  const recoverable = isRecoverable();

  return (
    <div className={`rounded-lg p-6 ${
      recoverable ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-red-50 border-2 border-red-200'
    }`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
          recoverable ? 'text-yellow-600' : 'text-red-600'
        }`} />
        
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-2 ${
            recoverable ? 'text-yellow-900' : 'text-red-900'
          }`}>
            {recoverable ? 'Action Required' : 'Swap Failed'}
          </h3>
          
          <p className={`mb-4 ${
            recoverable ? 'text-yellow-800' : 'text-red-800'
          }`}>
            {errorMessage}
          </p>
          
          {/* Error details for debugging (only in development) */}
          {process.env.NODE_ENV === 'development' && typeof error === 'object' && 'details' in error && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3">
            {recoverable && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            {onGoHome && (
              <button
                onClick={onGoHome}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  recoverable 
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}