/**
 * URL Configuration Test Component
 * Shows current URL configuration for debugging
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Settings, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { getEnvironmentInfo, getPasswordResetUrl, getEmailConfirmUrl } from '@/utils/urlConfig';
import { useToast } from '@/hooks/use-toast';

const UrlConfigTest: React.FC = () => {
  const { toast } = useToast();
  const envInfo = getEnvironmentInfo();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: `${label} has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  const testUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          URL Configuration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Info */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Environment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environment:</span>
                <Badge variant={envInfo.environment === 'Production' ? 'default' : 'secondary'}>
                  {envInfo.environment}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hostname:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {envInfo.hostname}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Port:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {envInfo.port || 'default'}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Protocol:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {envInfo.protocol}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* URL Configuration */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            URL Configuration
          </h3>
          
          {/* Base URL */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Base URL:</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(envInfo.baseUrl, 'Base URL')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => testUrl(envInfo.baseUrl)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              {envInfo.baseUrl}
            </code>
          </div>

          {/* Password Reset URL */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Password Reset URL:</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(envInfo.resetPasswordUrl, 'Password Reset URL')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => testUrl(envInfo.resetPasswordUrl)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              {envInfo.resetPasswordUrl}
            </code>
          </div>

          {/* Email Confirm URL */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Email Confirm URL:</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(envInfo.confirmEmailUrl, 'Email Confirm URL')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => testUrl(envInfo.confirmEmailUrl)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              {envInfo.confirmEmailUrl}
            </code>
          </div>
        </div>

        {/* Test Functions */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Test Functions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const resetUrl = getPasswordResetUrl();
                toast({
                  title: 'Password Reset URL',
                  description: resetUrl,
                });
              }}
            >
              Test getPasswordResetUrl()
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const confirmUrl = getEmailConfirmUrl();
                toast({
                  title: 'Email Confirm URL',
                  description: confirmUrl,
                });
              }}
            >
              Test getEmailConfirmUrl()
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Configuration Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Development: Uses current origin (localhost)</li>
                <li>• Production: Uses https://ezcar24.com</li>
                <li>• Supabase site_url is set to production URL</li>
                <li>• All redirect URLs are automatically configured</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UrlConfigTest;
