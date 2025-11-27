/**
 * Email Test Component
 * Test SMTP configuration and email functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Settings,
  Info,
  RefreshCw,
  Eye,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPasswordResetUrl, getEnvironmentInfo } from '@/utils/urlConfig';

const EmailTestComponent: React.FC = () => {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    passwordReset?: { success: boolean; error?: string };
    magicLink?: { success: boolean; error?: string };
  }>({});

  const envInfo = getEnvironmentInfo();

  const testPasswordReset = async () => {
    if (!testEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to test',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: getPasswordResetUrl()
      });

      if (error) {
        setResults(prev => ({
          ...prev,
          passwordReset: { success: false, error: error.message }
        }));
        toast({
          title: 'Password Reset Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setResults(prev => ({
          ...prev,
          passwordReset: { success: true }
        }));
        toast({
          title: 'Password Reset Email Sent',
          description: `Reset email sent to ${testEmail}`,
        });
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        passwordReset: { success: false, error: error.message }
      }));
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testMagicLink = async () => {
    if (!testEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to test',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: `${envInfo.baseUrl}/auth?tab=login`
        }
      });

      if (error) {
        setResults(prev => ({
          ...prev,
          magicLink: { success: false, error: error.message }
        }));
        toast({
          title: 'Magic Link Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setResults(prev => ({
          ...prev,
          magicLink: { success: true }
        }));
        toast({
          title: 'Magic Link Sent',
          description: `Magic link sent to ${testEmail}`,
        });
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        magicLink: { success: false, error: error.message }
      }));
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyEmailTemplate = (type: 'reset' | 'confirm' | 'magic') => {
    const templates = {
      reset: `<h2>Reset Your Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>`,
      confirm: `<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>`,
      magic: `<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>`
    };

    navigator.clipboard.writeText(templates[type]);
    toast({
      title: 'Template Copied',
      description: `${type} email template copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      {/* SMTP Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMTP Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p><strong>✅ SMTP Configured:</strong> smtp.zoho.com:587</p>
                <p><strong>✅ Sender:</strong> noreply@ezcar24.com</p>
                <p><strong>✅ Environment:</strong> {envInfo.environment}</p>
                <p><strong>✅ Reset URL:</strong> {getPasswordResetUrl()}</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Expected SMTP Settings:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Host:</strong> smtp.zoho.com</p>
                <p><strong>Port:</strong> 587</p>
                <p><strong>Security:</strong> STARTTLS</p>
                <p><strong>Auth:</strong> Required</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Configuration Steps:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Generate App Password in Zoho</li>
                <li>Update Supabase SMTP settings</li>
                <li>Configure email templates</li>
                <li>Test email delivery</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Functionality Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to test"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testPasswordReset}
              disabled={loading || !testEmail}
              className="flex items-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test Password Reset
            </Button>

            <Button
              onClick={testMagicLink}
              disabled={loading || !testEmail}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test Magic Link
            </Button>
          </div>

          {/* Test Results */}
          {(results.passwordReset || results.magicLink) && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Test Results:</h4>
              
              {results.passwordReset && (
                <div className="flex items-center gap-2">
                  {results.passwordReset.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Password Reset: {results.passwordReset.success ? 'Success' : 'Failed'}
                  </span>
                  {results.passwordReset.error && (
                    <Badge variant="destructive" className="text-xs">
                      {results.passwordReset.error}
                    </Badge>
                  )}
                </div>
              )}

              {results.magicLink && (
                <div className="flex items-center gap-2">
                  {results.magicLink.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Magic Link: {results.magicLink.success ? 'Success' : 'Failed'}
                  </span>
                  {results.magicLink.error && (
                    <Badge variant="destructive" className="text-xs">
                      {results.magicLink.error}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy these templates to your Supabase Auth settings:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => copyEmailTemplate('reset')}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Password Reset
            </Button>

            <Button
              variant="outline"
              onClick={() => copyEmailTemplate('confirm')}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Email Confirmation
            </Button>

            <Button
              variant="outline"
              onClick={() => copyEmailTemplate('magic')}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Magic Link
            </Button>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Note:</strong> Professional HTML templates are available in the email-templates.html file.
              Copy and paste them into your Supabase Auth email template settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTestComponent;
