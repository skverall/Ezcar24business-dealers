/**
 * Admin Credentials Reset Information Page
 * Shows the new admin credentials after security reset
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminCredentialsInfo from '@/components/admin/AdminCredentialsInfo';

const AdminCredentialsReset: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Security Reset Complete
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The admin authentication system has been reset with enhanced security features. 
            Use the credentials below to access the admin panel.
          </p>
        </div>

        {/* Status Alert */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Security Reset Successful!</strong> All admin accounts have been reset with new secure passwords. 
            Previous sessions have been invalidated and failed login attempts have been cleared.
          </AlertDescription>
        </Alert>

        {/* Credentials Information */}
        <AdminCredentialsInfo />

        {/* Security Improvements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security Improvements Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Authentication Security</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Strong password requirements (12+ characters)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Account lockout after 5 failed attempts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Bcrypt password hashing with salt rounds
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Session token-based authentication
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Session Management</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Extended 12-hour session duration
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Automatic session cleanup
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    IP address and user agent tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Comprehensive activity logging
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">Login with New Credentials</h4>
                  <p className="text-sm text-blue-700">
                    Use either the primary admin or backup admin credentials to access the admin panel.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">Change Default Passwords</h4>
                  <p className="text-sm text-blue-700">
                    Immediately change the default passwords to your own secure passwords after first login.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">Review Security Settings</h4>
                  <p className="text-sm text-blue-700">
                    Check admin settings and configure additional security measures as needed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Security Notice:</strong> Keep these credentials secure and do not share them. 
            The default passwords shown here should be changed immediately after your first login. 
            Consider enabling two-factor authentication for additional security.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button 
            onClick={() => window.open('/admin', '_blank')}
            size="lg"
            className="flex items-center gap-2"
          >
            <Shield className="h-5 w-5" />
            Access Admin Panel
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            size="lg"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCredentialsReset;
