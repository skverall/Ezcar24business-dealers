import { supabase } from '@/integrations/supabase/client';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  user_id?: string;
  url?: string;
  user_agent?: string;
  created_at?: string;
}

/**
 * Centralized logging service
 *
 * Usage:
 * ```ts
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Failed to save', { error: e.message });
 * ```
 */
class Logger {
  private static instance: Logger;
  private buffer: LogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private enabled = true;

  private constructor() {
    // Flush buffer before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: Record<string, any>) {
    if (import.meta.env.DEV) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    // Console output in development
    if (import.meta.env.DEV) {
      const logMethod = level === LogLevel.ERROR ? 'error' :
                       level === LogLevel.WARN ? 'warn' :
                       level === LogLevel.DEBUG ? 'debug' : 'log';

      console[logMethod](`[${level.toUpperCase()}] ${message}`, context || '');
    }

    // Add to buffer
    this.buffer.push(entry);

    // Flush immediately for errors in production
    if (level === LogLevel.ERROR && import.meta.env.PROD) {
      this.flush();
    }
    // Otherwise flush when buffer is full or after timeout
    else if (this.buffer.length >= this.BUFFER_SIZE) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Remove sensitive data from context
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Schedule buffer flush
   */
  private scheduleFlush() {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush buffer to database
   */
  async flush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      // Get current user ID if available
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      const logsWithUser = logs.map(log => ({
        ...log,
        user_id: userId
      }));

      // RLS: anonymous users can only insert error-level logs (see policy)
      const allowedLogs = userId
        ? logsWithUser
        : logsWithUser.filter(log => log.level === LogLevel.ERROR);

      // If nothing is allowed (e.g., only info/warn/debug while anon), skip
      if (allowedLogs.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('Skipped non-error logs for anonymous user due to RLS policy', { dropped: logsWithUser.length });
        }
        return;
      }

      // Send to Supabase
      const { error } = await supabase
        .from('application_logs')
        .insert(allowedLogs);

      if (error) {
        // Fallback to console if database insert fails
        console.error('Failed to send logs to database:', error);
        console.table(logs);
      }
    } catch (error) {
      // Fallback to console
      console.error('Logger flush error:', error);
      console.table(logs);
    }
  }

  /**
   * Clear all buffered logs without sending
   */
  clear() {
    this.buffer = [];
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
