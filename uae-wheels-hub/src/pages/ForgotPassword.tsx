/**
 * Forgot Password Page
 * Allows users to request password reset emails
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Send,
  Info,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPasswordResetUrl, getEnvironmentInfo } from '@/utils/urlConfig';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const envInfo = getEnvironmentInfo();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectUrl = getPasswordResetUrl();
      console.log('Sending password reset email:', { email, redirectUrl });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Supabase reset password error:', error);
        throw error;
      }

      console.log('Password reset email sent successfully');
      setSuccess(true);
      toast({
        title: 'Reset Email Sent',
        description: 'Please check your email for password reset instructions.',
      });

    } catch (error: any) {
      console.error('Error sending reset email:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check Your Email
            </CardTitle>
            <p className="text-gray-600 mt-2">
              We've sent you a secure reset link
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-3">
              <p className="text-gray-700">
                A password reset link has been sent to:
              </p>
              <p className="font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {email}
              </p>
              <p className="text-sm text-gray-600">
                Click the link in your email to reset your password securely.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Didn't receive the email?
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left max-w-xs mx-auto">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes for delivery</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Another Email
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth?tab=login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Reset Your Password
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your email address and we'll send you a secure reset link
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full h-12 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>

            {/* Navigation Links */}
            <div className="flex flex-col gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth?tab=login')}
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/auth?tab=signup"
                  className="text-blue-600 hover:text-blue-800 font-medium underline-offset-4 hover:underline"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
