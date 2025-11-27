import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SafeProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_dealer: boolean | null;
  created_at: string;
}

/**
 * Hook for loading safe, public profile data that doesn't expose sensitive information
 * Use this for displaying other users' profiles or public profile information
 */
export const useSecureProfile = (profileUserId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SafeProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSecureProfile = async (targetUserId?: string) => {
    const userId = targetUserId || profileUserId;
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use public_profiles view for secure public access
      const { data, error } = await supabase
        .from('public_profiles')
        .select('user_id, full_name, avatar_url, is_dealer, created_at')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading secure profile:', error);
        setProfile(null);
        return;
      }

      if (data) {
        // Map the public_profiles data to SafeProfileData format
        setProfile({
          id: '', // Not available in public view for security
          user_id: data.user_id,
          full_name: data.full_name,
          location: null, // Not included in public view for security
          avatar_url: data.avatar_url,
          bio: null, // Not included in public view for security
          is_dealer: data.is_dealer,
          created_at: data.created_at
        } as SafeProfileData);
      } else {
        setProfile(null);
      }
    } catch (error: any) {
      console.error('Error loading secure profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Get display name (safe for public display)
  const getPublicDisplayName = () => {
    if (!profile?.full_name) return 'Anonymous User';
    
    // If viewing own profile, show full name
    if (user?.id === profile.user_id) {
      return profile.full_name;
    }
    
    // For others, show only first name + last initial
    const parts = profile.full_name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0];
    }
    
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = profile?.full_name || 'User';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (profileUserId) {
      loadSecureProfile(profileUserId);
    }
  }, [profileUserId]);

  return {
    profile,
    loading,
    loadSecureProfile,
    getPublicDisplayName,
    getInitials
  };
};