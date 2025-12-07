import { AppError } from './AppError';

/**
 * Error thrown when API requests fail
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super('API_ERROR', message, statusCode, context);
  }

  getUserMessage(): string {
    if (this.statusCode === 401) {
      return 'Please sign in to continue';
    }

    if (this.statusCode === 403) {
      return 'You do not have permission to perform this action';
    }

    if (this.statusCode === 404) {
      return 'The requested resource was not found';
    }

    if (this.statusCode >= 500) {
      return 'Server error. Please try again later';
    }

    return this.message || 'An error occurred while processing your request';
  }
}

/**
 * Error thrown when network requests fail
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network error. Please check your connection', context?: Record<string, any>) {
    super('NETWORK_ERROR', message, 0, context);
  }

  getUserMessage(): string {
    return 'Connection issue. Please check your internet connection';
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('AUTH_ERROR', message, 401, context);
  }

  getUserMessage(): string {
    return 'Authentication failed. Please sign in again';
  }
}
