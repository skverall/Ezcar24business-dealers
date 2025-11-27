/**
 * Admin authentication hook
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminAuth, AdminUser, LoginResult, PasswordChangeResult, DashboardStats } from '@/utils/adminAuth';

interface UseAdminAuthReturn {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<PasswordChangeResult>;
  validateSession: () => Promise<void>;
  dashboardStats: DashboardStats | null;
  loadDashboardStats: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Validate current session
   */
  const validateSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await AdminAuth.validateSession();

      if (result.valid && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login admin user
   */
  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const result = await AdminAuth.login(username, password);

      if (result.success && result.session) {
        setUser(result.session.user);
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout admin user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AdminAuth.logout();
      setUser(null);
      setDashboardStats(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Change admin password
   */
  const changePassword = useCallback(async (
    currentPassword: string, 
    newPassword: string
  ): Promise<PasswordChangeResult> => {
    return await AdminAuth.changePassword(currentPassword, newPassword);
  }, []);

  /**
   * Load dashboard statistics
   */
  const loadDashboardStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const stats = await AdminAuth.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
    }
  }, [isAuthenticated]);

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async () => {
    await validateSession();
    if (isAuthenticated) {
      await loadDashboardStats();
    }
  }, [validateSession, loadDashboardStats, isAuthenticated]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  /**
   * Load dashboard stats when authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
    }
  }, [isAuthenticated, loadDashboardStats]);

  /**
   * Set up session validation interval
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Validate session every 5 minutes
    const interval = setInterval(() => {
      validateSession();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, validateSession]);

  /**
   * Handle session timeout warning
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Warn user 10 minutes before session expires
    const warningTimeout = setTimeout(() => {
      if (isAuthenticated) {
        console.warn('Admin session will expire soon');
        // Could show a toast notification here
      }
    }, 7.5 * 60 * 60 * 1000); // 7.5 hours (30 minutes before 8-hour expiry)

    return () => clearTimeout(warningTimeout);
  }, [isAuthenticated, user]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    changePassword,
    validateSession,
    dashboardStats,
    loadDashboardStats,
    refreshAuth
  };
};
