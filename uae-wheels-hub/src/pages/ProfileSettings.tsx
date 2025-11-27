import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Trash2, 
  Save, 
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '@/components/ProfileAvatar';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import PhoneInputMask from '@/components/PhoneInputMask';

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_dealer: boolean | null;
  verification_status: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

const ProfileSettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    location: '',
    bio: '',
    is_dealer: false,
    company_name: ''
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email_listings: true,
    email_messages: true,
    email_favorites: true,
    push_notifications: false
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data as ProfileData);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          location: data.location || '',
          bio: data.bio || '',
          is_dealer: data.is_dealer || false,
          company_name: data.company_name || ''
        });
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email,
          phone: user.user_metadata?.phone || '',
          is_dealer: false
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        
        setProfile(created as ProfileData);
        setFormData({
          full_name: created.full_name || '',
          phone: created.phone || '',
          whatsapp: created.whatsapp || '',
          location: created.location || '',
          bio: created.bio || '',
          is_dealer: created.is_dealer || false,
          company_name: created.company_name || ''
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Failed to load profile',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          location: formData.location,
          bio: formData.bio,
          is_dealer: formData.is_dealer,
          company_name: formData.is_dealer ? formData.company_name : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.'
      });

      // Reload profile to get updated data
      await loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Failed to save profile',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      // First, mark the profile as deleted and anonymize data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: 'Deleted User',
          phone: null,
          whatsapp: null,
          location: null,
          bio: null,
          avatar_url: null,
          company_name: null,
          deleted_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Continue with deletion even if profile update fails
      }

      // Delete user listings (soft delete)
      const { error: listingsError } = await supabase
        .from('listings')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'deleted'
        })
        .eq('user_id', user.id);

      if (listingsError) {
        console.error('Error deleting listings:', listingsError);
        // Continue with deletion even if listings update fails
      }

      // Call the user deletion RPC function (this should be a database function that handles the deletion properly)
      const { error: deleteError } = await supabase.rpc('delete_user_account', {
        user_id: user.id
      });

      if (deleteError) {
        // If RPC fails, try direct auth deletion as fallback
        console.warn('RPC deletion failed, attempting direct deletion:', deleteError);

        // Request account deletion via support (as a fallback)
        const { error: supportError } = await supabase
          .from('support_requests')
          .insert({
            user_id: user.id,
            type: 'account_deletion',
            message: 'User requested account deletion from mobile app',
            created_at: new Date().toISOString()
          });

        if (supportError) {
          console.error('Error creating support request:', supportError);
        }

        toast({
          title: 'Account deletion requested',
          description: 'Your account deletion request has been submitted. You will receive a confirmation email within 24 hours.',
        });
      } else {
        toast({
          title: 'Account deleted',
          description: 'Your account has been permanently deleted.'
        });
      }

      // Logout and redirect regardless of deletion method
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Failed to delete account',
        description: 'Please contact support at info@ezcar24.com for account deletion assistance.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getVerificationBadge = () => {
    const status = profile?.verification_status || 'unverified';
    
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Verification</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Profile Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar Section */}
            <div className="md:col-span-1">
              <ProfileAvatar
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name}
                onAvatarUpdate={(newUrl) => {
                  setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
                }}
                size="xl"
              />
            </div>

            {/* Profile Form */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    {getVerificationBadge()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed from here
                      </p>
                      {!user?.email_confirmed_at && (
                        <div className="mt-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                          Your email is not confirmed yet. Please check your inbox and confirm your email.
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={async () => {
                              try {
                                const { error } = await supabase.auth.resend({
                                  type: 'signup',
                                  email: user?.email || '',
                                } as any);
                                if (error) throw error;
                                toast({ title: 'Email sent', description: 'Confirmation email has been resent.' });
                              } catch (e: any) {
                                toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
                              }
                            }}
                          >
                            Resend confirmation
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <PhoneInputMask
                          value={formData.phone}
                          onChange={(value) => handleInputChange('phone', value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        <PhoneInputMask
                          value={formData.whatsapp}
                          onChange={(value) => handleInputChange('whatsapp', value)}
                          className="pl-10"
                          placeholder="+971 5x xxx xxxx"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Buyers can contact you directly via WhatsApp
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="City, Country"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  {/* Dealer Settings */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="is_dealer" className="text-base font-medium">Dealer Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable if you're selling cars professionally
                        </p>
                      </div>
                      <Switch
                        id="is_dealer"
                        checked={formData.is_dealer}
                        onCheckedChange={(checked) => handleInputChange('is_dealer', checked)}
                      />
                    </div>

                    {formData.is_dealer && (
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company_name"
                            value={formData.company_name}
                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                            placeholder="Your company name"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={saveProfile} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="max-w-2xl">
            <PasswordChangeForm />
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Account Deletion Section */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-2">Permanent Account Deletion</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This action will permanently delete your account and cannot be undone.
                      All your data will be removed from our servers within 30 days.
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-sm mb-2">What will be deleted:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your profile and personal information</li>
                    <li>• All your car listings and photos</li>
                    <li>• Your favorites and saved searches</li>
                    <li>• All messages and conversations</li>
                    <li>• Your account login credentials</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Make sure to download any important data before proceeding.
                    This action cannot be reversed.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        Delete Account Permanently?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This will permanently delete your account and all associated data.
                          This action cannot be undone.
                        </p>
                        <div className="bg-destructive/10 p-3 rounded-md">
                          <p className="text-sm font-medium text-destructive mb-1">
                            All of the following will be permanently deleted:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Profile and personal information</li>
                            <li>• Car listings and photos</li>
                            <li>• Favorites and activity history</li>
                            <li>• Messages and conversations</li>
                          </ul>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Are you absolutely sure you want to proceed?
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting Account...
                          </>
                        ) : (
                          'Yes, Delete Permanently'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileSettings;