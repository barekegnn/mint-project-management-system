'use client';

/**
 * Global Error Boundary
 * 
 * This component catches critical errors that occur in the root layout
 * and provides a fallback UI.
 */

import { useEffect } from 'react';
import { Logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the critical error
    Logger.error('Critical error caught by global error boundary', error, {
      digest: error.digest,
      component: 'GlobalErrorBoundary',
      severity: 'critical',
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white shadow-2xl rounded-lg p-8">
            <div className="flex flex-col items-center text-center">
              {/* Critical Error Icon */}
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Critical Error
              </h1>
              <p className="text-gray-600 mb-6">
                A critical error occurred. Please refresh the page or contact support if the problem persists.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded text-left">
                  <p className="text-sm font-mono text-red-800 break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                  {error.stack && (
                    <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={reset}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Reload Page
                </button>
              </div>

              {/* Support Information */}
              <div className="mt-8 p-4 bg-gray-50 rounded w-full text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Need immediate assistance?
                </p>
                <p className="text-sm text-gray-600">
                  Email:{' '}
                  <a
                    href="mailto:support@example.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@example.com
                  </a>
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Reference this error ID when contacting support: {error.digest}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
