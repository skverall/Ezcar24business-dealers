/**
 * Admin authentication utilities
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'moderator' | 'super_admin';
  full_name?: string;
  email?: string;
}

export interface AdminSession {
  session_token: string;
  session_id: string;
  user: AdminUser;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  session?: AdminSession;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  user?: AdminUser;
  session_id?: string;
}

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  listings: {
    total: number;
    active: number;
    pending: number;
  };
  users: {
    total: number;
    active: number;
  };
  messages: {
    total: number;
  };
  recent_activities: Array<{
    action: string;
    resource_type?: string;
    created_at: string;
    admin_username?: string;
  }>;
}

/**
 * Admin authentication class
 */
export class AdminAuth {
  private static readonly SESSION_KEY = 'admin_session_token';
  private static readonly SESSION_EXPIRY_KEY = 'admin_session_expiry';

  /**
   * Login admin user
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    try {
      const { data, error } = await (supabase as any).rpc('authenticate_admin', {
        p_username: username,
        p_password: password,
        p_ip_address: null, // Could be enhanced to get real IP
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Admin login error:', error);
        return { success: false, error: 'Authentication failed' };
      }

      const result = data as any;

      if (!result?.success) {
        return { success: false, error: result?.error || 'Authentication failed' };
      }

      // Store session token securely
      this.setSessionToken(result.session_token);

      return {
        success: true,
        session: {
          session_token: result.session_token,
          session_id: result.session_id,
          user: result.user
        }
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Validate current session
   */
  static async validateSession(): Promise<ValidationResult> {
    const token = this.getSessionToken();

    if (!token) {
      return { valid: false, error: 'No session token found' };
    }

    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
        p_session_token: token
      });

      if (error) {
        console.error('Session validation error:', error);
        this.clearSession();
        return { valid: false, error: 'Session validation failed' };
      }

      const result = data as any;

      if (!result?.valid) {
        this.clearSession();
        return { valid: false, error: result?.error || 'Invalid session' };
      }

      return {
        valid: true,
        user: result.user,
        session_id: result.session_id
      };
    } catch (error) {
      console.error('Session validation error:', error);
      this.clearSession();
      return { valid: false, error: 'Network error occurred' };
    }
  }

  /**
   * Logout admin user
   */
  static async logout(): Promise<boolean> {
    const token = this.getSessionToken();
    if (!token) {
      return true;
    }

    try {
      await supabase.rpc('logout_admin', {
        p_session_token: token
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.clearSession();
    return true;
  }

  /**
   * Change admin password
   */
  static async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<PasswordChangeResult> {
    const token = this.getSessionToken();
    if (!token) {
      return { success: false, error: 'No active session' };
    }

    try {
      const { data, error } = await (supabase as any).rpc('change_admin_password', {
        p_session_token: token,
        p_current_password: currentPassword,
        p_new_password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        return { success: false, error: 'Password change failed' };
      }

      const result = data as any;
      return {
        success: !!result?.success,
        error: result?.error,
        message: result?.message
      };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats | null> {
    try {
      const { data, error } = await (supabase as any).rpc('get_admin_dashboard_stats');

      if (error) {
        console.error('Dashboard stats error:', error);
        return null;
      }

      return data as unknown as DashboardStats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return null;
    }
  }

  /**
   * Store session token securely
   */
  private static setSessionToken(token: string): void {
    localStorage.setItem(this.SESSION_KEY, token);
    // Set expiry time (8 hours from now)
    const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(this.SESSION_EXPIRY_KEY, expiry);
  }

  /**
   * Get session token
   */
  private static getSessionToken(): string | null {
    const token = localStorage.getItem(this.SESSION_KEY);
    const expiry = localStorage.getItem(this.SESSION_EXPIRY_KEY);

    if (!token || !expiry) {
      return null;
    }

    // Check if token is expired
    if (new Date() > new Date(expiry)) {
      this.clearSession();
      return null;
    }

    return token;
  }

  /**
   * Public accessor for the admin session token (validates expiry)
   */
  static getSessionTokenValue(): string | null {
    return this.getSessionToken();
  }

  /**
   * Clear session data
   */
  private static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
  }

  /**
   * Check if user is logged in
   */
  static isLoggedIn(): boolean {
    return this.getSessionToken() !== null;
  }
}
