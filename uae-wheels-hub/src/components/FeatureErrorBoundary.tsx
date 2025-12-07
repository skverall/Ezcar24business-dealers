import React, { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  onReset?: () => void;
}

/**
 * Feature-specific error boundary with custom fallback UI
 * Use this to wrap major features/sections instead of crashing the whole app
 *
 * Usage:
 * ```tsx
 * <FeatureErrorBoundary featureName="Dashboard">
 *   <BusinessDashboard />
 * </FeatureErrorBoundary>
 * ```
 */
export function FeatureErrorBoundary({ children, featureName, onReset }: FeatureErrorBoundaryProps) {
  const handleReset = () => {
    onReset?.();
  };

  return (
    <ErrorBoundary
      featureName={featureName}
      onReset={handleReset}
      fallback={(error, reset) => (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Error in {featureName}</CardTitle>
              </div>
              <CardDescription>
                Something went wrong while loading this feature. The error has been logged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && (
                <div className="text-xs bg-red-50 p-3 rounded border border-red-200">
                  <div className="font-semibold text-red-800 mb-1">Error:</div>
                  <div className="text-red-600 font-mono">{error.message}</div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={reset} className="flex-1" variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
