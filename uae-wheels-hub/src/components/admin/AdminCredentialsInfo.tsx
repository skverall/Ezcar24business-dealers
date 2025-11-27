/**
 * Admin Credentials Information Component
 * Shows current admin credentials after reset
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Key,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminCredentialsInfoProps {
  className?: string;
}

const AdminCredentialsInfo: React.FC<AdminCredentialsInfoProps> = ({ className }) => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const credentials = [
    {
      id: 'primary',
      title: 'Primary Admin',
      username: 'admin',
      password: 'EzCar24Admin2025!',
      role: 'super_admin',
      description: 'Main administrator account with full system access'
    },
    {
      id: 'backup',
      title: 'Backup Admin',
      username: 'superadmin',
      password: 'SuperAdmin2025!',
      role: 'super_admin',
      description: 'Backup administrator account for emergency access'
    }
  ];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: 'Copied to clipboard',
        description: `${field} has been copied to your clipboard.`
      });
      
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  return (
    <div className={className}>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Shield className="h-5 w-5" />
            Admin Credentials Reset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>IMPORTANT:</strong> These are the new admin credentials after the security reset. 
              Please change these passwords immediately after your first login for security.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {credentials.map((cred) => (
              <Card key={cred.id} className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {cred.title}
                    </CardTitle>
                    <Badge variant="secondary">{cred.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{cred.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Username */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Username:</span>
                      <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                        {cred.username}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(cred.username, `${cred.title} Username`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === `${cred.title} Username` ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Password:</span>
                      <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                        {showPasswords ? cred.password : '••••••••••••••••'}
                      </code>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePasswordVisibility}
                        className="h-8 w-8 p-0"
                      >
                        {showPasswords ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cred.password, `${cred.title} Password`)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === `${cred.title} Password` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Security Features:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Account lockout after 5 failed attempts (30 minutes)</li>
                <li>• Extended 12-hour session duration for admin users</li>
                <li>• Password strength requirements (minimum 12 characters)</li>
                <li>• Automatic password age checking (90-day expiry)</li>
                <li>• Comprehensive activity logging</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={togglePasswordVisibility}
              variant="outline"
              className="flex-1"
            >
              {showPasswords ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Passwords
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Passwords
                </>
              )}
            </Button>
            <Button 
              onClick={() => window.open('/admin', '_blank')}
              className="flex-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Open Admin Panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCredentialsInfo;
