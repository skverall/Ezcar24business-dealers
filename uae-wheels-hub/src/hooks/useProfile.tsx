import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_dealer: boolean | null;
  verification_status: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load profile with all fields (RLS will ensure user can only see their own sensitive data)
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

  const updateProfile = async (updates: Partial<Omit<ProfileData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !profile) return false;

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as ProfileData);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.'
      });

      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const updateAvatar = async (avatarUrl: string | null) => {
    if (!user || !profile) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      return true;
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      return false;
    }
  };

  // Get display name (company name for dealers, full name for individuals)
  const getDisplayName = () => {
    if (!profile) return 'User';
    if (profile.is_dealer && profile.company_name) {
      return profile.company_name;
    }
    return profile.full_name || 'User';
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!profile) return false;
    
    const requiredFields = ['full_name', 'phone'];
    const hasRequiredFields = requiredFields.every(field => 
      profile[field as keyof ProfileData]
    );

    if (profile.is_dealer) {
      return hasRequiredFields && !!profile.company_name;
    }

    return hasRequiredFields;
  };

  // Get verification badge info
  const getVerificationInfo = () => {
    const status = profile?.verification_status || 'unverified';
    
    switch (status) {
      case 'verified':
        return {
          status: 'verified',
          label: 'Verified',
          color: 'green',
          icon: '✓'
        };
      case 'pending':
        return {
          status: 'pending',
          label: 'Pending Verification',
          color: 'yellow',
          icon: '⏳'
        };
      default:
        return {
          status: 'unverified',
          label: 'Unverified',
          color: 'gray',
          icon: '○'
        };
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    updating,
    loadProfile,
    updateProfile,
    updateAvatar,
    getDisplayName,
    getInitials,
    isProfileComplete,
    getVerificationInfo
  };
};