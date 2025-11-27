/**
 * Password Reset Demo Component
 * Shows the complete password reset flow for testing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Key, 
  ExternalLink, 
  CheckCircle,
  ArrowRight,
  Info,
  Settings,
  Globe
} from 'lucide-react';
import { getEnvironmentInfo, getPasswordResetUrl } from '@/utils/urlConfig';
import { useToast } from '@/hooks/use-toast';

const PasswordResetDemo: React.FC = () => {
  const { toast } = useToast();
  const envInfo = getEnvironmentInfo();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'User Login Page',
      description: 'User clicks "Forgot your password?" link',
      url: '/auth?tab=login',
      action: 'View Login Page'
    },
    {
      id: 2,
      title: 'Forgot Password Page',
      description: 'User enters email and requests reset',
      url: '/forgot-password',
      action: 'Request Reset'
    },
    {
      id: 3,
      title: 'Email Sent',
      description: 'User receives email with reset link',
      url: null,
      action: 'Check Email'
    },
    {
      id: 4,
      title: 'Reset Password Page',
      description: 'User clicks link and sets new password',
      url: '/reset-password',
      action: 'Reset Password'
    },
    {
      id: 5,
      title: 'Success & Login',
      description: 'User is redirected back to login',
      url: '/auth?tab=login',
      action: 'Login Again'
    }
  ];

  const adminSteps = [
    {
      id: 1,
      title: 'Admin User Management',
      description: 'Admin selects user and clicks "Reset Password"',
      url: '/admin/users',
      action: 'Open User Management'
    },
    {
      id: 2,
      title: 'Password Reset Modal',
      description: 'Admin chooses Email Reset or Direct Reset',
      url: null,
      action: 'Open Modal'
    },
    {
      id: 3,
      title: 'Email Reset',
      description: 'Sends email to user with proper redirect URL',
      url: null,
      action: 'Send Email'
    },
    {
      id: 4,
      title: 'Direct Reset',
      description: 'Generate password and copy to clipboard',
      url: null,
      action: 'Generate Password'
    }
  ];

  const openUrl = (url: string) => {
    if (url) {
      window.open(url, '_blank');
      toast({
        title: 'Page Opened',
        description: `Opened ${url} in new tab`,
      });
    }
  };

  const testEmailReset = () => {
    toast({
      title: 'Email Reset Test',
      description: `Email would redirect to: ${getPasswordResetUrl()}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Current Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Environment:</span>
                <Badge variant={envInfo.environment === 'Production' ? 'default' : 'secondary'}>
                  {envInfo.environment}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Base URL:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {envInfo.baseUrl}
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Reset URL:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {envInfo.resetPasswordUrl}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Hostname:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {envInfo.hostname}
                </code>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Supabase Configuration:</strong> site_url is set to https://ezcar24.com for production redirects.
              Development URLs are allowed in uri_allow_list.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* User Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            User Password Reset Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= step.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              <div className="flex gap-2">
                {step.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUrl(step.url)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {step.action}
                  </Button>
                )}
                {step.id === 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testEmailReset}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Test Email URL
                  </Button>
                )}
              </div>

              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}

          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setCurrentStep(currentStep < steps.length ? currentStep + 1 : 1)}
              variant="outline"
            >
              {currentStep < steps.length ? 'Next Step' : 'Reset Demo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Admin Password Reset Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  {step.id}
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {step.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openUrl(step.url)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {step.action}
                </Button>
              )}

              {index < adminSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Test Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => openUrl('/auth?tab=login')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Test Login Page
            </Button>
            
            <Button
              variant="outline"
              onClick={() => openUrl('/forgot-password')}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Test Forgot Password
            </Button>
            
            <Button
              variant="outline"
              onClick={() => openUrl('/admin/users')}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Test Admin Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetDemo;
