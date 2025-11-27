/**
 * Admin security utilities
 */

export class AdminSecurity {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutes before expiry

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[^a-zA-Z\d]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one special character');
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      score = Math.max(0, score - 2);
      feedback.push('Password is too common, please choose a more unique password');
    }

    return {
      isValid: score >= 4 && password.length >= 8,
      score,
      feedback
    };
  }

  /**
   * Check if password is commonly used
   */
  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'administrator', 'root', 'user',
      'guest', 'test', 'demo', 'welcome', 'login'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate session token format
   */
  static isValidSessionToken(token: string): boolean {
    // Check if token is base64-like and has appropriate length
    const tokenRegex = /^[A-Za-z0-9_-]{40,50}$/;
    return tokenRegex.test(token);
  }

  /**
   * Get client fingerprint for additional security
   */
  static getClientFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Admin fingerprint', 2, 2);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      canvas: canvas.toDataURL(),
      cookieEnabled: navigator.cookieEnabled
    };

    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  }

  /**
   * Check if current time is within business hours (optional security measure)
   */
  static isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Monday to Friday, 6 AM to 10 PM
    return day >= 1 && day <= 5 && hour >= 6 && hour <= 22;
  }

  /**
   * Rate limiting for login attempts
   */
  static checkRateLimit(identifier: string): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
  } {
    const key = `admin_rate_limit_${identifier}`;
    const stored = localStorage.getItem(key);
    const now = Date.now();

    if (!stored) {
      const data = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      };
      localStorage.setItem(key, JSON.stringify(data));
      return {
        allowed: true,
        remainingAttempts: this.MAX_LOGIN_ATTEMPTS - 1,
        resetTime: now + this.LOCKOUT_DURATION
      };
    }

    const data = JSON.parse(stored);

    // Reset if lockout period has passed
    if (now - data.firstAttempt > this.LOCKOUT_DURATION) {
      const newData = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      };
      localStorage.setItem(key, JSON.stringify(newData));
      return {
        allowed: true,
        remainingAttempts: this.MAX_LOGIN_ATTEMPTS - 1,
        resetTime: now + this.LOCKOUT_DURATION
      };
    }

    // Check if max attempts exceeded
    if (data.attempts >= this.MAX_LOGIN_ATTEMPTS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: data.firstAttempt + this.LOCKOUT_DURATION
      };
    }

    // Increment attempts
    data.attempts += 1;
    data.lastAttempt = now;
    localStorage.setItem(key, JSON.stringify(data));

    return {
      allowed: true,
      remainingAttempts: this.MAX_LOGIN_ATTEMPTS - data.attempts,
      resetTime: data.firstAttempt + this.LOCKOUT_DURATION
    };
  }

  /**
   * Clear rate limit data (on successful login)
   */
  static clearRateLimit(identifier: string): void {
    const key = `admin_rate_limit_${identifier}`;
    localStorage.removeItem(key);
  }

  /**
   * Log security event
   */
  static logSecurityEvent(event: string, details: any = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      fingerprint: this.getClientFingerprint()
    };

    // In production, this should be sent to a security logging service
    console.warn('Security Event:', logEntry);

    // Store locally for debugging (limit to last 100 events)
    const key = 'admin_security_log';
    const stored = localStorage.getItem(key);
    const logs = stored ? JSON.parse(stored) : [];
    
    logs.unshift(logEntry);
    if (logs.length > 100) {
      logs.splice(100);
    }
    
    localStorage.setItem(key, JSON.stringify(logs));
  }

  /**
   * Check for suspicious activity patterns
   */
  static detectSuspiciousActivity(): {
    suspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let suspicious = false;

    // Check for rapid login attempts
    const key = 'admin_security_log';
    const stored = localStorage.getItem(key);
    if (stored) {
      const logs = JSON.parse(stored);
      const recentLogs = logs.filter((log: any) => 
        Date.now() - new Date(log.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
      );

      const loginAttempts = recentLogs.filter((log: any) => 
        log.event === 'login_attempt'
      ).length;

      if (loginAttempts > 10) {
        suspicious = true;
        reasons.push('Excessive login attempts detected');
      }
    }

    // Check for unusual access times
    if (!this.isBusinessHours()) {
      reasons.push('Access outside business hours');
    }

    return { suspicious, reasons };
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length === 32;
  }
}
