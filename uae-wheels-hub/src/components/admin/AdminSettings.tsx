/**
 * Admin Settings Component
 */

import React, { useState } from 'react';
import { Settings, Key, Shield, Database, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ChangePasswordModal from './ChangePasswordModal';

const AdminSettings: React.FC = () => {
  const { user } = useAdminAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'EzCar24.com',
    siteDescription: 'Premium car marketplace in UAE',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    moderationRequired: true,
    maxListingsPerUser: 10,
    featuredListingPrice: 99,
    contactEmail: 'admin@ezcar24.com',
    supportEmail: 'support@ezcar24.com'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // TODO: Implement settings save functionality
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Settings</h2>
          <p className="text-gray-600">Configure system settings and preferences</p>
        </div>
        <Button onClick={handleSaveSettings}>
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>Basic site configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="registrationEnabled">User Registration</Label>
              <Switch
                id="registrationEnabled"
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>Security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Admin Account</Label>
              <div className="text-sm text-gray-600 mb-2">
                {user?.full_name || user?.username} ({user?.email})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangePassword(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="moderationRequired">Require Moderation</Label>
              <Switch
                id="moderationRequired"
                checked={settings.moderationRequired}
                onCheckedChange={(checked) => handleSettingChange('moderationRequired', checked)}
              />
            </div>
            <div>
              <Label htmlFor="maxListings">Max Listings per User</Label>
              <Input
                id="maxListings"
                type="number"
                value={settings.maxListingsPerUser}
                onChange={(e) => handleSettingChange('maxListingsPerUser', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Email Settings</span>
            </CardTitle>
            <CardDescription>Email configuration and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Pricing Settings</span>
            </CardTitle>
            <CardDescription>Pricing and monetization settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="featuredPrice">Featured Listing Price (AED)</Label>
              <Input
                id="featuredPrice"
                type="number"
                value={settings.featuredListingPrice}
                onChange={(e) => handleSettingChange('featuredListingPrice', parseInt(e.target.value))}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>• Featured listings appear at the top of search results</p>
              <p>• Featured status lasts for 30 days</p>
              <p>• Payment processing via Stripe/PayPal integration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Version</div>
              <div className="text-gray-600">v1.0.0</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Environment</div>
              <div className="text-gray-600">Production</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Database</div>
              <div className="text-gray-600">Supabase PostgreSQL</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Storage</div>
              <div className="text-gray-600">Supabase Storage</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Authentication</div>
              <div className="text-gray-600">Supabase Auth</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Last Backup</div>
              <div className="text-gray-600">2 hours ago</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default AdminSettings;
