import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Camera, Trash2, Star, GripVertical, Image as ImageIcon, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useHaptics } from '@/hooks/useHaptics';
import { prepareImageForUpload } from '@/utils/imageProcessing';

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

  const isHeic = src?.toLowerCase().includes('.heic');

  // Try to force server-side conversion for HEIC
  const displaySrc = isHeic
    ? `${getProxiedImageUrl(src)}?format=jpeg&quality=80`
    : getProxiedImageUrl(src);

  if (hasError) {
    if (isHeic) {
      return (
        <div className={cn("bg-muted flex flex-col items-center justify-center p-2 h-full", className)}>
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium text-center">HEIC File</p>
          <p className="text-[10px] text-muted-foreground text-center">Preview unavailable</p>
        </div>
      );
    }
    return (
      <div className={cn("bg-muted flex items-center justify-center h-full", className)}>
        <div className="text-center text-muted-foreground p-2">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Image failed</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-luxury animate-spin" />
        </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        className={cn("w-full h-full object-cover transition-transform duration-500 hover:scale-105", className)}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}

function SortableThumb({ image, index, onDelete, onMakeCover, isOverlay = false }: {
  image: ListingImage;
  index: number;
  onDelete: (id: string) => void;
  onMakeCover: (id: string) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isCover = index === 0;

  if (isOverlay) {
    return (
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-luxury cursor-grabbing bg-background">
        <SafeImage src={image.url} alt="Moving photo" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-[4/3] rounded-xl overflow-hidden bg-background border transition-all duration-300",
        isCover ? "ring-2 ring-luxury border-transparent shadow-lg shadow-luxury/10" : "border-border hover:border-luxury/50 shadow-sm hover:shadow-md",
        "touch-manipulation"
      )}
    >
      {/* Drag Handle Area */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      <SafeImage
        src={image.url}
        alt={`Photo ${index + 1}`}
        className="w-full h-full pointer-events-none"
      />

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Cover Badge */}
      {isCover && (
        <div className="absolute top-2 left-2 z-10 animate-in fade-in zoom-in duration-300">
          <div className="bg-luxury/90 backdrop-blur-sm text-luxury-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            <span>Cover Photo</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 translate-y-[-10px] group-hover:translate-y-0">
        {!isCover && (
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onMakeCover(image.id);
            }}
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-muted-foreground hover:text-luxury shadow-sm backdrop-blur-sm"
            title="Set as cover"
          >
            <Star className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id);
          }}
          className="h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-sm backdrop-blur-sm"
          title="Delete photo"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Drag Hint */}
      <div className="absolute bottom-0 inset-x-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          <span>Drag to reorder</span>
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load images
  useEffect(() => {
    if (!listingId) {
      setImages([]);
      return;
    }

    const loadImages = async () => {
      try {
        const { data, error } = await supabase
          .from('listing_images')
          .select('id, url, sort_order, is_cover')
          .eq('listing_id', listingId)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        if (data) {
          // Ensure correct sort order based on is_cover if needed, but usually sort_order should reflect it
          // We'll trust sort_order from DB, but if multiple covers exist (shouldn't), we handle it.
          const sorted = data.sort((a, b) => a.sort_order - b.sort_order);
          setImages(sorted as ListingImage[]);
        }
      } catch (err) {
        console.error('Error loading images:', err);
      }
    };

    loadImages();
  }, [listingId]);

  const processFile = useCallback(async (file: File) => {
    const MAX_FILE_MB = 10;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max size is ${MAX_FILE_MB}MB`, variant: 'destructive' });
      return;
    }

    try {
      const { file: preparedFile } = await prepareImageForUpload(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        heicQuality: 0.92,
        jpegQuality: 0.85,
      });

      const id = await ensureDraftListing();
      const safeName = preparedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${userId}/${id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, preparedFile, {
        contentType: preparedFile.type || 'image/jpeg',
        upsert: false
      });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

      // New image goes to end of list
      const nextOrder = images.length;
      const isFirst = images.length === 0;

      const { data, error } = await supabase
        .from('listing_images')
        .insert({
          listing_id: id,
          url: pub.publicUrl,
          sort_order: nextOrder,
          is_cover: isFirst
        })
        .select()
        .single();

      if (error) throw error;

      setImages(prev => [...prev, data as ListingImage]);

      if (isFirst) {
        toast({ title: 'Cover photo set', description: 'First photo is automatically set as cover.' });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Could not upload image', variant: 'destructive' });
    }
  }, [userId, ensureDraftListing, images.length, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!userId) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      await Promise.all(acceptedFiles.map(processFile));
    } finally {
      setUploading(false);
    }
  }, [userId, processFile, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 20,
    disabled: uploading,
    noClick: true,
    noKeyboard: true
  });

  const handleDelete = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img) return;

    // Optimistic update
    const newImages = images.filter(i => i.id !== id);
    setImages(newImages);

    // If we deleted the cover (index 0), make the new index 0 the cover
    if (newImages.length > 0 && img.sort_order === 0) {
      // We'll handle reordering in DB below
    }

    const path = getPathFromPublicUrl(img.url);
    if (path) await supabase.storage.from(bucket).remove([path]);
    await supabase.from('listing_images').delete().eq('id', id);

    // Re-index remaining images
    updateSortOrder(newImages);
  };

  const handleMakeCover = async (id: string) => {
    const index = images.findIndex(i => i.id === id);
    if (index <= 0) return; // Already cover or not found

    const newImages = arrayMove(images, index, 0);
    setImages(newImages);
    updateSortOrder(newImages);

    toast({ title: 'Cover updated', description: 'New cover photo set.' });
  };

  const updateSortOrder = async (items: ListingImage[]) => {
    // Update local state first (already done usually)
    // Then update DB
    const updates = items.map((img, idx) => ({
      id: img.id,
      sort_order: idx,
      is_cover: idx === 0 // First item is always cover
    }));

    // We can't batch update easily with different values in Supabase without RPC or multiple calls
    // For < 20 images, parallel calls are fine
    await Promise.all(updates.map(u =>
      supabase.from('listing_images').update({
        sort_order: u.sort_order,
        is_cover: u.is_cover
      }).eq('id', u.id)
    ));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    photoCapture();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((i) => i.id === active.id);
      const newIndex = images.findIndex((i) => i.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);
      updateSortOrder(newImages);
    }
  };

  const capturePhoto = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true
      });
      if (image.dataUrl) {
        const res = await fetch(image.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `cam-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setUploading(true);
        await processFile(file);
        setUploading(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectFromLibrary = async () => {
    if (!Capacitor.isNativePlatform()) {
      open();
      return;
    }
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true
      });
      if (image.dataUrl) {
        const res = await fetch(image.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `lib-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setUploading(true);
        await processFile(file);
        setUploading(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative group border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 ease-out overflow-hidden",
          isDragActive
            ? "border-luxury bg-luxury/5 scale-[1.01] shadow-xl shadow-luxury/10"
            : "border-muted-foreground/20 hover:border-luxury/40 hover:bg-muted/30",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />

        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-luxury/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
            isDragActive ? "bg-luxury text-white scale-110" : "bg-white text-luxury group-hover:scale-110 group-hover:shadow-md"
          )}>
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-semibold tracking-tight">
              {isDragActive ? "Drop photos now" : "Upload your photos"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drag and drop high-quality images here, or browse to upload.
              <span className="block mt-1 text-xs opacity-70">Supports JPG, PNG, HEIC • Max 20 photos</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-xs">
            <Button
              variant="outline"
              size="lg"
              onClick={(e) => { e.stopPropagation(); selectFromLibrary(); }}
              className="flex-1 h-11 rounded-xl border-muted-foreground/20 hover:border-luxury hover:text-luxury hover:bg-luxury/5 transition-all"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            {Capacitor.isNativePlatform() && (
              <Button
                variant="default"
                size="lg"
                onClick={(e) => { e.stopPropagation(); capturePhoto(); }}
                className="flex-1 h-11 rounded-xl bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20"
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-medium text-sm text-muted-foreground">
                {images.length} Photo{images.length !== 1 && 's'} • <span className="text-luxury">First photo is cover</span>
              </h4>
            </div>

            <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <SortableThumb
                    key={image.id}
                    image={image}
                    index={index}
                    onDelete={handleDelete}
                    onMakeCover={handleMakeCover}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          <DragOverlay adjustScale={true} dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
            {activeId ? (
              <SortableThumb
                image={images.find(i => i.id === activeId)!}
                index={images.findIndex(i => i.id === activeId)}
                onDelete={() => { }}
                onMakeCover={() => { }}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
