/**
 * Password Reset Modal Component
 */

import React, { useState } from 'react';
import { X, Key, Mail, AlertTriangle, CheckCircle, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminUser } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';
import { useToast } from '@/hooks/use-toast';
import { getPasswordResetUrl, getEnvironmentInfo } from '@/utils/urlConfig';

interface PasswordResetModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const { toast } = useToast();

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
    setGeneratedPassword(password);
    setShowPassword(true);
    setShowConfirmPassword(true);

    toast({
      title: 'Password Generated',
      description: 'A secure password has been generated and is now visible in the form.',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Password has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  const handleSendResetEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await AdminApi.sendPasswordResetEmail(user.email);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await AdminApi.resetUserPassword(user.user_id, newPassword);

      if (response.success) {
        setSuccess(true);
        toast({
          title: 'Password Reset Successful',
          description: `Password has been reset for ${user.full_name || user.email}`,
        });
        onSuccess();
      } else {
        setError(response.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setGeneratedPassword(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Reset Password</h2>
              <p className="text-sm text-gray-500">
                {user.full_name || user.email}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Send Reset Email</TabsTrigger>
              <TabsTrigger value="direct">Direct Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="text-center space-y-4">
                <Mail className="w-12 h-12 text-blue-600 mx-auto" />
                <div>
                  <h3 className="font-medium">Send Password Reset Email</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    A password reset link will be sent to the user's email address
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg text-left space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Reset URL:</strong> The user will be redirected to{' '}
                    <code className="bg-white px-1 py-0.5 rounded text-xs">
                      {getPasswordResetUrl()}
                    </code>
                  </p>
                  <p className="text-xs text-blue-600">
                    <strong>Environment:</strong> {getEnvironmentInfo().environment}
                  </p>
                </div>

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-600 text-sm">
                      Password reset email sent successfully!
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleSendResetEmail} 
                  disabled={loading || success}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : success ? (
                    'Email Sent!'
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="direct" className="space-y-4 mt-4">
              <form onSubmit={handleDirectReset} className="space-y-4">
                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="new_password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        className="pr-20"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {newPassword && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(newPassword)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateRandomPassword}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters. Click the eye icon to show/hide password.
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {generatedPassword && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Key className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Generated Password:</strong> The password has been generated and is now visible in the form above.
                      Make sure to copy it before closing this dialog.
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-600 text-sm">
                      Password reset successfully!
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading || success} className="w-full">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : success ? (
                    'Password Reset!'
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
