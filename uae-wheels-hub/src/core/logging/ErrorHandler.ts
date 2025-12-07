import { toast } from '@/hooks/use-toast';
import { logger } from './Logger';
import { AppError, normalizeError, ApiError, NetworkError, AuthError, ValidationError } from '../errors';

/**
 * Centralized error handler
 *
 * Usage:
 * ```ts
 * try {
 *   await saveData();
 * } catch (error) {
 *   errorHandler.handle(error, 'Failed to save data');
 * }
 * ```
 */
class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with logging and user notification
   */
  handle(error: unknown, customMessage?: string, context?: Record<string, any>): AppError {
    const appError = normalizeError(error);

    // Log the error
    logger.error(customMessage || appError.message, {
      code: appError.code,
      statusCode: appError.statusCode,
      ...appError.context,
      ...context,
      stack: appError.stack
    });

    // Show user-friendly message
    this.showUserMessage(appError, customMessage);

    // In production, you could send to error monitoring service
    // if (import.meta.env.PROD) {
    //   this.sendToMonitoring(appError);
    // }

    return appError;
  }

  /**
   * Handle error silently (log only, no toast)
   */
  handleSilent(error: unknown, customMessage?: string, context?: Record<string, any>): AppError {
    const appError = normalizeError(error);

    logger.error(customMessage || appError.message, {
      code: appError.code,
      statusCode: appError.statusCode,
      ...appError.context,
      ...context,
      stack: appError.stack
    });

    return appError;
  }

  /**
   * Show user-friendly error message
   */
  private showUserMessage(error: AppError, customMessage?: string) {
    const message = customMessage || error.getUserMessage();
    const title = this.getErrorTitle(error);

    toast({
      title,
      description: message,
      variant: 'destructive'
    });
  }

  /**
   * Get error title based on error type
   */
  private getErrorTitle(error: AppError): string {
    if (error instanceof ValidationError) {
      return 'Validation Error';
    }

    if (error instanceof AuthError) {
      return 'Authentication Error';
    }

    if (error instanceof NetworkError) {
      return 'Connection Error';
    }

    if (error instanceof ApiError) {
      return 'Error';
    }

    return 'Something went wrong';
  }

  /**
   * Send error to monitoring service (e.g., Sentry)
   */
  // private sendToMonitoring(error: AppError) {
  //   // Implement integration with error monitoring service
  //   // Example: Sentry.captureException(error);
  // }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

/**
 * Result type for operations that can fail
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper to create success result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function err<T>(error: AppError): Result<T> {
  return { success: false, error };
}
