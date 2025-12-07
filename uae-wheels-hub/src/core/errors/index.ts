import { AppError } from './AppError';
import { ApiError, NetworkError, AuthError } from './ApiError';
import { ValidationError, FileValidationError, BusinessRuleError } from './ValidationError';

export { AppError };
export { ApiError, NetworkError, AuthError };
export { ValidationError, FileValidationError, BusinessRuleError };

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Normalizes any error into an AppError
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message, 500, {
      originalError: error.name,
      stack: error.stack
    });
  }

  if (typeof error === 'string') {
    return new AppError('UNKNOWN_ERROR', error, 500);
  }

  return new AppError('UNKNOWN_ERROR', 'An unexpected error occurred', 500, {
    error: String(error)
  });
}
