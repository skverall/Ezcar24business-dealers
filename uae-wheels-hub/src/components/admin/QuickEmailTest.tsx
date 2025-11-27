/**
 * Quick Email Test Component
 * Simple component for testing email functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPasswordResetUrl } from '@/utils/urlConfig';

const QuickEmailTest: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: 'success' | 'error';
    message: string;
    timestamp: Date;
  } | null>(null);

  const testPasswordReset = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetUrl()
      });

      if (error) {
        setLastResult({
          type: 'error',
          message: error.message,
          timestamp: new Date()
        });
        toast({
          title: 'Test Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setLastResult({
          type: 'success',
          message: `Password reset email sent to ${email}`,
          timestamp: new Date()
        });
        toast({
          title: 'Email Sent Successfully!',
          description: `Check ${email} for the password reset email`,
        });
      }
    } catch (error: any) {
      setLastResult({
        type: 'error',
        message: error.message || 'Unknown error occurred',
        timestamp: new Date()
      });
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Quick Email Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Test Email Address</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
            disabled={loading}
          />
        </div>

        <Button
          onClick={testPasswordReset}
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Test Email...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Password Reset Email
            </>
          )}
        </Button>

        {lastResult && (
          <Alert className={lastResult.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {lastResult.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={lastResult.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              <div className="space-y-1">
                <p>{lastResult.message}</p>
                <p className="text-xs opacity-75">
                  {lastResult.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>SMTP:</strong> smtp.zoho.com:587</p>
          <p><strong>From:</strong> noreply@ezcar24.com</p>
          <p><strong>Redirect:</strong> {getPasswordResetUrl()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickEmailTest;
