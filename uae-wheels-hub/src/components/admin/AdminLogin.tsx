/**
 * Admin login component
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminSecurity } from '@/utils/adminSecurity';

interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { login, isLoading } = useAdminAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remainingAttempts: number;
    resetTime: number;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Sanitize inputs
    const username = AdminSecurity.sanitizeInput(formData.username.trim());
    const password = formData.password;

    // Basic validation
    if (!username) {
      setError('Username is required');
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }

    // Check rate limiting
    const rateLimit = AdminSecurity.checkRateLimit(username);
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime);
      setError(`Too many failed attempts. Try again after ${resetTime.toLocaleTimeString()}`);
      setRateLimitInfo({
        remainingAttempts: rateLimit.remainingAttempts,
        resetTime: rateLimit.resetTime
      });
      setIsSubmitting(false);
      return;
    }

    // Log security event
    AdminSecurity.logSecurityEvent('login_attempt', {
      username,
      timestamp: new Date().toISOString(),
      fingerprint: AdminSecurity.getClientFingerprint()
    });

    try {
      const result = await login(username, password);

      if (result.success) {
        // Clear rate limit on successful login
        AdminSecurity.clearRateLimit(username);

        // Clear form
        setFormData({ username: '', password: '' });
        setRateLimitInfo(null);
        setError('');

        // Log successful login
        AdminSecurity.logSecurityEvent('login_success', { username });

        onLoginSuccess?.();
      } else {
        // Log failed login
        AdminSecurity.logSecurityEvent('login_failure', {
          username,
          error: result.error
        });

        // Enhanced error messages
        let errorMessage = result.error || 'Login failed';

        if (errorMessage.includes('Invalid credentials')) {
          errorMessage = 'Invalid username or password. Please check your credentials.';
        } else if (errorMessage.includes('Account is disabled')) {
          errorMessage = 'Your account has been disabled. Please contact support.';
        } else if (errorMessage.includes('temporarily locked')) {
          errorMessage = 'Account temporarily locked due to multiple failed attempts. Please try again later.';
        } else if (errorMessage.includes('Authentication failed')) {
          errorMessage = 'Authentication failed. Please verify your credentials and try again.';
        }

        setError(errorMessage);
        setRateLimitInfo({
          remainingAttempts: Math.max(0, rateLimit.remainingAttempts - 1),
          resetTime: rateLimit.resetTime
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      AdminSecurity.logSecurityEvent('login_error', {
        username,
        error: error.message
      });

      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        errorMessage = 'Admin system not properly configured. Please contact technical support.';
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Panel
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access the administration dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {rateLimitInfo && rateLimitInfo.remainingAttempts > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {rateLimitInfo.remainingAttempts} attempt{rateLimitInfo.remainingAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                disabled={isSubmitting || isLoading}
                className="w-full"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isSubmitting || isLoading}
                  className="w-full pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting || isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure admin access only. All activities are logged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
