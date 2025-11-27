import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_dealer: boolean | null;
}

interface SecureProfileDisplayProps {
  profile: Profile;
  showPrivateInfo?: boolean;
}

export const SecureProfileDisplay = ({ profile, showPrivateInfo = false }: SecureProfileDisplayProps) => {
  const { user } = useAuth();
  const isOwner = user?.id === profile.user_id;
  
  // Only show private info if user is the owner or explicitly allowed
  const canShowPrivateInfo = isOwner || showPrivateInfo;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">
        {profile.full_name ? 
          (canShowPrivateInfo ? profile.full_name : getPublicName(profile.full_name)) : 
          'Anonymous User'
        }
      </h3>
      
      {profile.location && (
        <p className="text-muted-foreground">{profile.location}</p>
      )}
      
      {profile.bio && (
        <p className="text-sm">{profile.bio}</p>
      )}
      
      {profile.is_dealer && (
        <span className="inline-block px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
          Dealer
        </span>
      )}
      
      {/* Only show sensitive info to owner - email and phone are now secured by RLS */}
      {canShowPrivateInfo && isOwner && (
        <div className="space-y-1 text-sm text-muted-foreground">
          {profile.email && <p>Email: {profile.email}</p>}
          {profile.phone && <p>Phone: {formatPhoneSecurely(profile.phone)}</p>}
        </div>
      )}
    </div>
  );
};

// Helper function to show only first name + last initial
const getPublicName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return parts[0];
  }
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
};

// Helper function to format phone securely
const formatPhoneSecurely = (phone: string): string => {
  if (phone.length <= 4) return phone;
  
  const lastFour = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return `${masked}${lastFour}`;
};