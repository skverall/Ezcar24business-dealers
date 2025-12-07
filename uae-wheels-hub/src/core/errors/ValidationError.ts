import { AppError } from './AppError';

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    context?: Record<string, any>
  ) {
    super('VALIDATION_ERROR', message, 400, { ...context, field });
  }

  getUserMessage(): string {
    if (this.field) {
      return `${this.field}: ${this.message}`;
    }
    return this.message;
  }
}

/**
 * Error thrown when file validation fails
 */
export class FileValidationError extends AppError {
  constructor(
    message: string,
    public fileName?: string,
    context?: Record<string, any>
  ) {
    super('FILE_VALIDATION_ERROR', message, 400, { ...context, fileName });
  }

  getUserMessage(): string {
    if (this.fileName) {
      return `${this.fileName}: ${this.message}`;
    }
    return this.message;
  }
}

/**
 * Error thrown when business rules are violated
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('BUSINESS_RULE_ERROR', message, 422, context);
  }

  getUserMessage(): string {
    return this.message;
  }
}
