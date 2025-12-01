import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Camera, Upload, Trash2, Star, GripVertical, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useHaptics } from '@/hooks/useHaptics';

export type ListingImage = {
  id: string;
  url: string;
  sort_order: number;
  is_cover: boolean;
};

interface EnhancedPhotoUploaderProps {
  userId: string;
  listingId: string | null;
  ensureDraftListing: () => Promise<string>;
}

const bucket = 'listing-images';

function getPathFromPublicUrl(url: string): string | null {
  const idx = url.indexOf(`${bucket}/`);
  if (idx === -1) return null;
  return url.slice(idx + bucket.length + 1);
}

function SafeImage({ src, alt, className, onError }: {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.warn('SafeImage: Failed to load image:', src);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    const isHeic = src.toLowerCase().includes('.heic') || src.toLowerCase().includes('.heif');
    return (
      <div className={cn("bg-muted flex items-center justify-center", className)}>
        <div className="text-center text-muted-foreground p-2">
          {isHeic ? (
            <>
              <div className="w-8 h-8 mx-auto mb-2 opacity-50 border-2 border-dashed border-current rounded flex items-center justify-center text-[10px] font-bold">HEIC</div>
              <p className="text-xs">Processing...</p>
            </>
          ) : (
            <>
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Image failed to load</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-luxury border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={getProxiedImageUrl(src)}
        alt={alt}
        className={cn("w-full h-full object-cover", className)}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}

function CoverDropZone({ coverImage, onMakeCover, onDelete }: {
  coverImage: ListingImage | undefined;
  onMakeCover: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'cover-drop-zone',
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coverImage) {
      onDelete(coverImage.id);
    }
  };

  if (!coverImage) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isOver
            ? "border-luxury bg-luxury/20 scale-105"
            : "border-luxury/30 bg-luxury/5 hover:border-luxury/50 hover:bg-luxury/10"
        )}
      >
        <Star className="w-8 h-8 text-luxury/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag a photo here to set as cover
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Or click ⭐ on any photo below
        </p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 p-2 transition-all duration-200",
        isOver
          ? "border-luxury bg-luxury/20 scale-105"
          : "border-luxury bg-luxury/5"
      )}
    >
      <div className="relative group">
        <SafeImage
          src={getProxiedImageUrl(coverImage.url)}
          alt="Cover photo"
          className="w-full h-32 rounded"
        />

        <div className="absolute top-2 left-2 bg-luxury text-luxury-foreground text-xs font-medium px-2 py-1 rounded flex items-center gap-1 shadow-md">
          <Star className="w-3 h-3 fill-current" />
          Cover Photo
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteClick}
            className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 text-white shadow-md hover:shadow-lg transition-all duration-200"
            title="Delete cover photo"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {isOver && (
          <div className="absolute inset-0 bg-luxury/30 rounded flex items-center justify-center">
            <div className="bg-white/90 px-3 py-1 rounded text-sm font-medium text-luxury">
              Drop to set as cover
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableThumb({ image, onDelete, onMakeCover }: {
  image: ListingImage;
  onDelete: (id: string) => void;
  onMakeCover: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCoverClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('SortableThumb: Cover button clicked for image:', image.id);
    onMakeCover(image.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('SortableThumb: Delete button clicked for image:', image.id);
    onDelete(image.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "relative group rounded-lg overflow-hidden border transition-all duration-200",
        isDragging ? "border-luxury shadow-lg z-10" : "border-border hover:border-luxury/50",
        "touch-manipulation" // Better touch support
      )}
    >
      {/* Drag Handle - separate from buttons */}
      <div
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      />
      <SafeImage
        src={getProxiedImageUrl(image.url)}
        alt=""
        className="w-full h-32 pointer-events-none"
      />

      {/* Cover Badge - Always visible */}
      {image.is_cover && (
        <div className="absolute top-2 left-2 bg-luxury text-luxury-foreground text-xs font-medium px-2 py-1 rounded flex items-center gap-1 shadow-md">
          <Star className="w-3 h-3 fill-current" />
          Cover
        </div>
      )}

      {/* Action Buttons - Always visible on mobile, hover on desktop */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button
          size="sm"
          variant={image.is_cover ? "default" : "secondary"}
          onClick={handleCoverClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className={cn(
            "h-8 w-8 p-0 shadow-md hover:shadow-lg transition-all duration-200 relative z-20",
            image.is_cover
              ? "bg-luxury hover:bg-luxury/90 text-luxury-foreground"
              : "bg-white/90 hover:bg-white text-foreground"
          )}
          title={image.is_cover ? "This is the cover photo" : "Set as cover photo"}
          disabled={image.is_cover}
        >
          <Star className={cn("w-4 h-4", image.is_cover ? "fill-current" : "")} />
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleDeleteClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 text-white shadow-md hover:shadow-lg transition-all duration-200 relative z-20"
          title="Delete photo"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Drag Indicator - Only visible when dragging */}
      {isDragging && (
        <div className="absolute inset-0 bg-luxury/20 border-2 border-luxury border-dashed rounded-lg flex items-center justify-center">
          <GripVertical className="w-6 h-6 text-luxury" />
        </div>
      )}

      {/* Drag hint for desktop */}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          Drag to reorder
        </div>
      </div>
    </div>
  );
}

export default function EnhancedPhotoUploader({ userId, listingId, ensureDraftListing }: EnhancedPhotoUploaderProps) {
  const { toast } = useToast();
  const { photoCapture } = useHaptics();
  const [images, setImages] = useState<ListingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Increased distance to avoid conflicts with clicks
        tolerance: 5,
        delay: 150 // Longer delay to distinguish from clicks
      }
    })
  );

  // Debug: Log component props and check auth
  useEffect(() => {
    console.log('EnhancedPhotoUploader: Props:', { userId, listingId });

    // Check Supabase auth state
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error('EnhancedPhotoUploader: Auth error:', error);
      } else {
        console.log('EnhancedPhotoUploader: Current user:', user?.id);
      }
    });
  }, [userId, listingId]);

  // Load existing images when listingId available
  useEffect(() => {
    if (!listingId) {
      console.log('EnhancedPhotoUploader: No listingId, clearing images');
      setImages([]);
      return;
    }

    console.log('EnhancedPhotoUploader: Loading images for listingId:', listingId);

    // Clear existing images first to avoid showing stale data
    setImages([]);

    const loadImages = async () => {
      try {
        const { data, error } = await supabase
          .from('listing_images')
          .select('id, url, sort_order, is_cover, created_at')
          .eq('listing_id', listingId)
          .order('is_cover', { ascending: false })
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('EnhancedPhotoUploader: Error loading images:', error);
          toast({
            title: 'Failed to load photos',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        console.log('EnhancedPhotoUploader: Loaded images:', data);

        if (data && data.length > 0) {
          const typedImages = data.map(img => ({
            id: img.id,
            url: img.url,
            sort_order: img.sort_order,
            is_cover: img.is_cover
          })) as ListingImage[];

          // Validate image URLs
          const validImages = typedImages.filter(img => {
            if (!img.url || img.url.trim() === '') {
              console.warn('EnhancedPhotoUploader: Found image with empty URL:', img.id);
              return false;
            }
            return true;
          });

          if (validImages.length !== typedImages.length) {
            console.warn(`EnhancedPhotoUploader: Filtered out ${typedImages.length - validImages.length} images with invalid URLs`);
          }

          setImages(validImages);
          console.log('EnhancedPhotoUploader: Set images state:', validImages);
        } else {
          console.log('EnhancedPhotoUploader: No images found for listing');
          setImages([]);
        }
      } catch (err) {
        console.error('EnhancedPhotoUploader: Exception loading images:', err);
        toast({
          title: 'Failed to load photos',
          description: 'An unexpected error occurred',
          variant: 'destructive'
        });
      }
    };

    loadImages();
  }, [listingId, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Check if user is authenticated
    if (!userId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to upload photos.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      let id = listingId;

      // Ensure we have a listing ID before uploading
      if (!id) {
        try {
          id = await ensureDraftListing();
          console.log('EnhancedPhotoUploader: Created draft listing with ID:', id);
        } catch (error: any) {
          console.error('EnhancedPhotoUploader: Failed to create draft listing:', error);
          toast({
            title: 'Upload failed',
            description: 'Could not create listing. Please try again.',
            variant: 'destructive'
          });
          return;
        }
      }

      console.log('EnhancedPhotoUploader: Using listing ID for upload:', id);

      for (const file of acceptedFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
        const path = `${userId}/${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: false });

        if (uploadError) {
          console.error('EnhancedPhotoUploader: Storage upload failed:', uploadError);
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        console.log('EnhancedPhotoUploader: Generated public URL:', publicUrl);

        // Always check database for cover image to ensure accuracy
        // Don't rely on local state during batch uploads
        const { data: existingCover, error: coverCheckError } = await supabase
          .from('listing_images')
          .select('id')
          .eq('listing_id', id)
          .eq('is_cover', true)
          .maybeSingle();

        if (coverCheckError) {
          console.error('EnhancedPhotoUploader: Error checking existing cover:', coverCheckError);
        }

        const shouldBeCover = !existingCover;
        console.log('EnhancedPhotoUploader: Should be cover image:', shouldBeCover);

        const nextOrder = Math.max(...images.map(img => img.sort_order), -1) + 1;
        console.log('EnhancedPhotoUploader: Next sort order:', nextOrder);

        const { data, error } = await supabase
          .from('listing_images')
          .insert({
            listing_id: id,
            url: pub.publicUrl,
            sort_order: nextOrder,
            is_cover: shouldBeCover
          })
          .select()
          .single();

        if (error) {
          console.error('EnhancedPhotoUploader: Save failed for file:', file.name, error);
          toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        } else {
          const newImage = data as ListingImage;
          console.log('EnhancedPhotoUploader: Successfully uploaded image:', {
            id: newImage.id,
            url: newImage.url,
            is_cover: newImage.is_cover,
            sort_order: newImage.sort_order
          });

          setImages(prev => {
            const updated = [...prev, newImage];
            console.log('EnhancedPhotoUploader: Updated images state, total count:', updated.length);
            return updated;
          });

          // If this is the first image, make sure it's set as cover
          if (shouldBeCover) {
            console.log('EnhancedPhotoUploader: Setting as cover image:', newImage.id);
            await supabase
              .from('listing_images')
              .update({ is_cover: true })
              .eq('id', newImage.id);
          }
        }
      }
      // Reload images from database to ensure consistency
      const finalListingId = listingId || id;
      if (finalListingId) {
        console.log('EnhancedPhotoUploader: Reloading images after upload batch for listing:', finalListingId);
        const { data: refreshedImages } = await supabase
          .from('listing_images')
          .select('id, url, sort_order, is_cover')
          .eq('listing_id', finalListingId)
          .order('is_cover', { ascending: false })
          .order('sort_order', { ascending: true });

        if (refreshedImages) {
          setImages((refreshedImages as ListingImage[]).map(img => ({ ...img, url: getProxiedImageUrl(img.url) })));
          console.log('EnhancedPhotoUploader: Refreshed images from database:', refreshedImages.length);
          console.log('EnhancedPhotoUploader: Cover images:', refreshedImages.filter(img => img.is_cover).length);
          console.log('EnhancedPhotoUploader: Non-cover images:', refreshedImages.filter(img => !img.is_cover).length);
        }
      }
    } catch (err: any) {
      console.error('EnhancedPhotoUploader: Upload batch failed:', err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [images, listingId, ensureDraftListing, userId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 20,
    disabled: uploading
  });

  // Native camera capture
  const capturePhoto = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'Camera not available',
        description: 'Camera capture is only available on mobile devices.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);

      // Trigger haptic feedback
      await photoCapture();

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1920,
        height: 1920,
        correctOrientation: true
      });

      if (image.dataUrl) {
        // Convert data URL to blob
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();

        // Create a file from the blob
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Process the file using existing upload logic
        await processFile(file);
      }
    } catch (error: any) {
      console.error('Camera capture error:', error);
      if (error.message !== 'User cancelled photos app') {
        toast({
          title: 'Camera error',
          description: 'Failed to capture photo. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Capture from photo library
  const selectFromLibrary = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to file input on web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          onDrop(Array.from(files));
        }
      };
      input.click();
      return;
    }

    try {
      setUploading(true);

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1920,
        height: 1920,
        correctOrientation: true
      });

      if (image.dataUrl) {
        // Convert data URL to blob
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();

        // Create a file from the blob
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Process the file using existing upload logic
        await processFile(file);
      }
    } catch (error: any) {
      console.error('Photo library error:', error);
      if (error.message !== 'User cancelled photos app') {
        toast({
          title: 'Photo selection error',
          description: 'Failed to select photo. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Process a single file (used by both camera and file upload)
  const processFile = async (file: File) => {
    const MAX_FILE_MB = 10;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const isHeicExtension = /\.(heic|heif)$/i.test(file.name);

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && !isHeicExtension) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, WebP, GIF, or HEIC images.',
        variant: 'destructive'
      });
      return;
    }

    let fileToUpload = file;

    // Convert HEIC to JPEG
    const isHeic = file.type.toLowerCase() === 'image/heic' ||
      file.type.toLowerCase() === 'image/heif' ||
      /\.(heic|heif)$/i.test(file.name);

    if (isHeic) {
      try {
        console.log('Converting HEIC file:', file.name);
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });

        const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        fileToUpload = new File([blobToUse], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg'
        });
        console.log('Conversion successful:', fileToUpload.name);
      } catch (e) {
        console.error('HEIC conversion failed:', e);
        toast({
          title: 'Conversion failed',
          description: 'Could not process HEIC image. Please try converting it to JPG first.',
          variant: 'destructive'
        });
        return;
      }
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please upload images smaller than ${MAX_FILE_MB}MB.`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const id = await ensureDraftListing();
      // Use fileToUpload.name to ensure we use the .jpg extension for converted files
      const path = `${userId}/${id}/${Date.now()}-${fileToUpload.name}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, fileToUpload, {
        contentType: fileToUpload.type,
        upsert: false
      });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Upload failed',
          description: uploadError.message,
          variant: 'destructive'
        });
        return;
      }

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const nextOrder = (images[images.length - 1]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('listing_images')
        .insert({
          listing_id: id,
          url: pub.publicUrl,
          sort_order: nextOrder,
          is_cover: images.length === 0
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: 'Save failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setImages(prev => [...prev, data as ListingImage]);
        toast({
          title: 'Photo uploaded',
          description: 'Your photo has been uploaded successfully.',
        });
      }
    } catch (error: any) {
      console.error('Process file error:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img) return;

    const path = getPathFromPublicUrl(img.url);
    if (path) {
      await supabase.storage.from(bucket).remove([path]);
    }

    const { error } = await supabase.from('listing_images').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setImages(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleMakeCover = async (id: string) => {
    const target = images.find(i => i.id === id);
    if (!target || target.is_cover) {
      console.log('EnhancedPhotoUploader: Cannot make cover - target not found or already cover:', { id, target, is_cover: target?.is_cover });
      return;
    }

    console.log('EnhancedPhotoUploader: Making image cover:', id);

    try {
      // Get the listing ID (either existing or create draft)
      const currentListingId = listingId || await ensureDraftListing();
      console.log('EnhancedPhotoUploader: Using listing ID for cover update:', currentListingId);

      // First, unset all covers for this listing
      const { error: unsetError } = await supabase
        .from('listing_images')
        .update({ is_cover: false })
        .eq('listing_id', currentListingId);

      if (unsetError) {
        console.error('EnhancedPhotoUploader: Failed to unset covers:', unsetError);
        toast({ title: 'Failed to set cover', description: unsetError.message, variant: 'destructive' });
        return;
      }

      // Then set the new cover
      const { error: setCoverError } = await supabase
        .from('listing_images')
        .update({ is_cover: true })
        .eq('id', id);

      if (setCoverError) {
        console.error('EnhancedPhotoUploader: Failed to set cover:', setCoverError);
        toast({ title: 'Failed to set cover', description: setCoverError.message, variant: 'destructive' });
        return;
      }

      console.log('EnhancedPhotoUploader: Successfully updated cover in database');

      // Update local state
      setImages(prev => prev.map(i => ({ ...i, is_cover: i.id === id })));
      toast({ title: 'Cover photo updated', description: 'This photo is now your cover image.' });

    } catch (err: any) {
      console.error('EnhancedPhotoUploader: Exception in handleMakeCover:', err);
      toast({ title: 'Failed to set cover', description: err.message, variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    // Check if dropped on cover zone
    if (over.id === 'cover-drop-zone') {
      await handleMakeCover(active.id);
      return;
    }

    // Regular reordering logic
    if (active.id === over.id) return;

    const oldIndex = images.findIndex(i => i.id === active.id);
    const newIndex = images.findIndex(i => i.id === over.id);
    const newArr = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({ ...img, sort_order: idx }));

    setImages(newArr);

    // Persist new order
    for (const img of newArr) {
      await supabase.from('listing_images').update({ sort_order: img.sort_order }).eq('id', img.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-all duration-200 photo-uploader-mobile",
          isDragActive
            ? "border-luxury bg-luxury/5 scale-105"
            : "border-muted hover:border-luxury/50 hover:bg-luxury/5",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-luxury/10 rounded-full">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-luxury border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-luxury" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-base sm:text-lg font-medium">
              {isDragActive ? "Drop photos here" : "Drag & drop photos here"}
            </p>
            <p className="text-sm text-muted-foreground">or use the buttons below</p>
            <p className="text-xs text-muted-foreground">
              Up to 20 images • JPG, PNG • First photo will be the cover
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 hover:bg-luxury/10"
              onClick={selectFromLibrary}
              disabled={uploading}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {Capacitor.isNativePlatform() ? 'Photo Library' : 'Select Photos'}
            </Button>

            {Capacitor.isNativePlatform() && (
              <Button
                variant="luxury"
                className="flex-1 hover-lift"
                onClick={capturePhoto}
                disabled={uploading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <div>Debug: {images.length} images loaded, listingId: {listingId || 'none'}</div>
          <div>Cover images: {images.filter(img => img.is_cover).length}</div>
          <div>Non-cover images: {images.filter(img => !img.is_cover).length}</div>
          {images.length > 0 && images.filter(img => img.is_cover).length === 0 && (
            <div className="text-red-500 font-semibold">⚠️ NO COVER IMAGE FOUND!</div>
          )}
          {images.filter(img => img.is_cover).length > 1 && (
            <div className="text-red-500 font-semibold">⚠️ MULTIPLE COVER IMAGES!</div>
          )}
          {images.length > 0 && (
            <div className="mt-1">
              Images: {images.map(img => `${img.id.slice(0, 8)}(cover:${img.is_cover}, order:${img.sort_order})`).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">
                Uploaded Photos ({images.length}/20)
              </h4>
              <p className="text-sm text-muted-foreground">
                Drag photos to reorder • Drag to cover zone to set main photo
              </p>
            </div>

            {/* Cover Photo Zone */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-luxury" />
                Cover Photo (Main listing photo)
              </h5>
              <CoverDropZone
                coverImage={images.find(img => img.is_cover)}
                onMakeCover={handleMakeCover}
                onDelete={handleDelete}
              />
            </div>

            {/* Other Photos */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-foreground">
                Other Photos ({images.filter(img => !img.is_cover).length})
              </h5>

              {images.filter(img => !img.is_cover).length > 0 ? (
                <SortableContext items={images.filter(img => !img.is_cover).map(i => i.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {images.filter(img => !img.is_cover).map(img => (
                      <SortableThumb
                        key={img.id}
                        image={img}
                        onDelete={handleDelete}
                        onMakeCover={handleMakeCover}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No additional photos</p>
                  {images.length > 1 && (
                    <p className="text-xs mt-1">
                      All {images.length} images are marked as cover. This might be an error.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DndContext>
      )}
    </div>
  );
}