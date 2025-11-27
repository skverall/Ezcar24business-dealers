/**
 * Password Reset Test Page
 * For testing password reset functionality
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordResetUrl, getEnvironmentInfo } from '@/utils/urlConfig';

const PasswordResetTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const envInfo = getEnvironmentInfo();

  const handleTest = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const redirectUrl = getPasswordResetUrl();
      console.log('Testing password reset with:', { email, redirectUrl });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        throw error;
      }

      setResult(`Password reset email sent successfully to ${email}`);
    } catch (error: any) {
      console.error('Password reset test error:', error);
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setError(`Session error: ${error.message}`);
        return;
      }

      if (session) {
        setResult(`Active session found for user: ${session.user.email}`);
      } else {
        setResult('No active session');
      }
    } catch (error: any) {
      setError(`Session check failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Password Reset Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Test Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to test"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleTest} disabled={loading}>
                {loading ? 'Sending...' : 'Test Password Reset'}
              </Button>
              <Button variant="outline" onClick={handleTestSession}>
                Check Session
              </Button>
            </div>

            {result && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {result}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Environment:</strong> {envInfo.environment}</div>
              <div><strong>Base URL:</strong> {envInfo.baseUrl}</div>
              <div><strong>Reset Password URL:</strong> {envInfo.resetPasswordUrl}</div>
              <div><strong>Hostname:</strong> {envInfo.hostname}</div>
              <div><strong>Protocol:</strong> {envInfo.protocol}</div>
              {envInfo.port && <div><strong>Port:</strong> {envInfo.port}</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Valid Reset Link Example:</strong>
              <br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {envInfo.resetPasswordUrl}?access_token=test&refresh_token=test&type=recovery
              </code>
            </div>
            <div>
              <strong>Expired Link Example:</strong>
              <br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {envInfo.resetPasswordUrl}?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordResetTest;
