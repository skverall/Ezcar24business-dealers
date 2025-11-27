/**
 * Password Reset Page
 * Handles password reset from email links
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [tempTokens, setTempTokens] = useState<{accessToken: string, refreshToken: string} | null>(null);

  useEffect(() => {
    // Supabase sends tokens in the URL hash (#access_token=...) by default
    // but we also support query params just in case.
    const searchAccessToken = searchParams.get('access_token');
    const searchRefreshToken = searchParams.get('refresh_token');
    const searchType = searchParams.get('type');
    const searchError = searchParams.get('error');
    const searchErrorDescription = searchParams.get('error_description');
    const searchErrorCode = searchParams.get('error_code');

    // Parse hash params as a fallback (or primary source)
    const rawHash = typeof window !== 'undefined' ? window.location.hash : '';
    const hash = rawHash?.startsWith('#') ? rawHash.slice(1) : rawHash;
    const hashParams = new URLSearchParams(hash || '');

    let accessToken = searchAccessToken || hashParams.get('access_token');
    let refreshToken = searchRefreshToken || hashParams.get('refresh_token');
    let type = searchType || hashParams.get('type');
    const errorParam = searchError || hashParams.get('error');
    const errorDescription = searchErrorDescription || hashParams.get('error_description');
    const errorCode = searchErrorCode || hashParams.get('error_code');

    console.log('Reset password URL params:', {
      type,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      error: errorParam,
      errorCode,
      errorDescription,
      source: {
        fromSearch: {
          access: !!searchAccessToken,
          refresh: !!searchRefreshToken,
          type: !!searchType,
        },
        fromHash: {
          access: !!hashParams.get('access_token'),
          refresh: !!hashParams.get('refresh_token'),
          type: !!hashParams.get('type'),
        }
      }
    });

    // Handle error cases first
    if (errorParam) {
      let errorMessage = 'Invalid reset link';

      if (errorParam === 'access_denied') {
        if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
          errorMessage = 'Password reset link has expired. Please request a new one.';
        } else if (errorDescription?.includes('invalid')) {
          errorMessage = 'Password reset link is invalid. Please request a new one.';
        } else {
          errorMessage = errorDescription || 'Access denied. Please request a new reset link.';
        }
      } else {
        errorMessage = errorDescription || `Error: ${errorParam}`;
      }

      setError(errorMessage);
      setValidToken(false);
      return;
    }

    // Handle valid recovery flow
    if (type === 'recovery' && accessToken && refreshToken) {
      // SECURITY FIX: Don't set session automatically - just validate tokens
      // Store tokens temporarily for password reset, but don't authenticate user yet
      console.log('Valid recovery tokens received');

      // Clean sensitive tokens from the URL immediately
      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname + window.location.search; // drop hash
        window.history.replaceState({}, document.title, cleanUrl);
      }

      // Store tokens temporarily for password reset (not in session storage)
      setTempTokens({ accessToken, refreshToken });
      setValidToken(true);
    } else {
      // Missing required parameters
      setError('Invalid reset link. Please request a new password reset.');
      setValidToken(false);
    }
  }, [searchParams]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // SECURITY FIX: Set session with temp tokens only when updating password
      if (!tempTokens) {
        throw new Error('Invalid session. Please request a new password reset.');
      }

      // Temporarily set session to update password
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tempTokens.accessToken,
        refresh_token: tempTokens.refreshToken
      });

      if (sessionError) {
        throw new Error('Invalid or expired reset link. Please request a new one.');
      }

      // Now update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      // Clear temp tokens
      setTempTokens(null);

      setSuccess(true);
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });

      // Sign out to ensure user must log in with new password
      await supabase.auth.signOut();

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth?tab=login');
      }, 3000);

    } catch (error: any) {
      console.error('Error updating password:', error);

      let errorMessage = 'Failed to update password';

      if (error.message?.includes('session')) {
        errorMessage = 'Session expired. Please request a new password reset link.';
        setValidToken(false);
        setTempTokens(null);
      } else if (error.message?.includes('expired')) {
        errorMessage = 'Reset link has expired. Please request a new password reset.';
        setValidToken(false);
        setTempTokens(null);
      } else if (error.message?.includes('invalid')) {
        errorMessage = 'Invalid reset link. Please request a new password reset.';
        setValidToken(false);
        setTempTokens(null);
      } else if (error.message?.includes('weak')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message?.includes('same')) {
        errorMessage = 'New password must be different from your current password.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/forgot-password')} className="w-full">
                Request New Reset Link
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth?tab=login')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Password Updated Successfully
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Your password has been changed securely
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">
                  ✓ Password updated successfully
                </p>
                <p className="text-green-700 text-sm mt-1">
                  You can now sign in with your new password
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth?tab=login')}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Continue to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Reset Your Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Enter your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Strength: {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Confirm your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
