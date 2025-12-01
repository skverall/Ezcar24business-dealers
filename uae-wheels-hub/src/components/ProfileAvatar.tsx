import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import heic2any from 'heic2any';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  onAvatarUpdate?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  fullName,
  onAvatarUpdate,
  size = 'lg',
  className
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(avatarUrl);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB');
      }

      let fileToUpload = file;

      // HEIC Conversion
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
          toast({
            title: 'Converting HEIC...',
            description: 'Please wait while we convert your image.',
          });

          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
          });

          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          fileToUpload = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (error) {
          console.error('ProfileAvatar: HEIC conversion failed:', error);
          toast({
            title: 'Conversion Warning',
            description: 'Could not convert HEIC image. Attempting to upload original.',
            variant: 'destructive'
          });
        }
      }

      // Create unique filename
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete existing avatar if it exists
      if (localAvatarUrl) {
        const existingPath = localAvatarUrl.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${existingPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setLocalAvatarUrl(newAvatarUrl);
      onAvatarUpdate?.(newAvatarUrl);

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been successfully updated.'
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !localAvatarUrl) return;

    setUploading(true);
    try {
      // Delete from storage
      const existingPath = localAvatarUrl.split('/').pop();
      if (existingPath) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${existingPath}`]);
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setLocalAvatarUrl(null);
      onAvatarUpdate?.('');

      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been removed.'
      });

    } catch (error: any) {
      console.error('Avatar removal error:', error);
      toast({
        title: 'Removal failed',
        description: error.message || 'Failed to remove avatar',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn("w-fit", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Avatar className={cn(sizeClasses[size], "border-4 border-muted")}>
              <AvatarImage
                src={getProxiedImageUrl(localAvatarUrl || '')}
                alt={fullName || 'Profile'}
                className="object-cover"
              />
              <AvatarFallback className="bg-luxury/10 text-luxury font-semibold text-lg">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>

            {/* Upload overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={triggerFileSelect}>
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-lg">{fullName || 'Your Name'}</h3>
            <p className="text-sm text-muted-foreground">Profile Picture</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileSelect}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {localAvatarUrl ? 'Change' : 'Upload'}
            </Button>

            {localAvatarUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeAvatar}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            JPG, PNG or GIF. Max 5MB.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAvatar;