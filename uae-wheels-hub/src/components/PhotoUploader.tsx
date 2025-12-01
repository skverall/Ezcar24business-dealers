import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { useToast } from '@/hooks/use-toast';
import { isHeicFile, prepareImageForUpload } from '@/utils/imageProcessing';

export type ListingImage = {
  id: string;
  url: string;
  sort_order: number;
  is_cover: boolean;
};

interface PhotoUploaderProps {
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

function SortableThumb({ image, onDelete, onMakeCover }: { image: ListingImage; onDelete: (id: string) => void; onMakeCover: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isHeic = image.url.toLowerCase().includes('.heic');
  const [hasError, setHasError] = useState(false);

  const displaySrc = isHeic
    ? `${getProxiedImageUrl(image.url)}?format=jpeg&quality=80`
    : getProxiedImageUrl(image.url);

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {isHeic && hasError ? (
        <div className="w-full h-32 rounded-md border bg-muted flex flex-col items-center justify-center p-2">
          <p className="text-xs font-medium text-center">HEIC File</p>
          <p className="text-[10px] text-muted-foreground text-center">Preview unavailable</p>
        </div>
      ) : (
        <img
          src={displaySrc}
          alt=""
          loading="lazy"
          className="w-full h-32 object-cover rounded-md border"
          onError={() => setHasError(true)}
        />
      )}
      {image.is_cover && (
        <span className="absolute top-1 left-1 bg-luxury text-black text-xs font-medium px-2 py-0.5 rounded">Cover</span>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-start justify-end p-2 gap-2 rounded-md">
        <button {...attributes} {...listeners} title="Drag" className="opacity-0 group-hover:opacity-100 transition text-white text-xs px-2 py-1 bg-black/40 rounded">
          Drag
        </button>
        {!image.is_cover && (
          <button onClick={() => onMakeCover(image.id)} className="opacity-0 group-hover:opacity-100 transition text-white text-xs px-2 py-1 bg-black/40 rounded">
            Set cover
          </button>
        )}
        <button onClick={() => onDelete(image.id)} className="opacity-0 group-hover:opacity-100 transition text-white text-xs px-2 py-1 bg-red-600 rounded">
          Delete
        </button>
      </div>
    </div>
  );
}

export default function PhotoUploader({ userId, listingId, ensureDraftListing }: PhotoUploaderProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<ListingImage[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Load existing images when listingId available
  useEffect(() => {
    if (!listingId) return;
    supabase.from('listing_images').select('*').eq('listing_id', listingId).order('is_cover', { ascending: false }).order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast({ title: 'Failed to load photos', description: error.message, variant: 'destructive' });
        } else {
          setImages(((data || []) as ListingImage[]).map(img => ({ ...img, url: getProxiedImageUrl(img.url) })));
        }
      });
  }, [listingId]);

  const MAX_FILE_MB = 10; // client-side cap per file
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate files
    const tooBig = acceptedFiles.find(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast({ title: 'Image too large', description: `Please upload images up to ${MAX_FILE_MB}MB.`, variant: 'destructive' });
      return;
    }
    const badType = acceptedFiles.find(f => !ALLOWED_TYPES.includes(f.type));
    if (badType) {
      toast({ title: 'Unsupported format', description: 'Allowed: JPG, PNG, WEBP, GIF.', variant: 'destructive' });
      return;
    }

    const id = listingId || await ensureDraftListing();

    for (const file of acceptedFiles) {
      let fileToUpload: File;

      try {
        if (isHeicFile(file)) {
          toast({
            title: 'Converting HEIC...',
            description: 'We convert HEIC/HEIF photos to JPEG before upload.',
          });
        }

        const { file: processed } = await prepareImageForUpload(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          heicQuality: 0.92,
          jpegQuality: 0.85,
        });

        fileToUpload = processed;
      } catch (error) {
        console.error('PhotoUploader: Image preparation failed:', error);
        toast({
          title: 'Image processing failed',
          description: isHeicFile(file)
            ? 'Could not convert your HEIC photo. Please retry or export as JPEG.'
            : 'Could not process this file. Please try another image.',
          variant: 'destructive'
        });
        continue;
      }

      const fileName = `${Date.now()}-${fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const path = `${userId}/${id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, fileToUpload, { upsert: false, contentType: fileToUpload.type || 'image/jpeg' });
      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        continue;
      }
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const nextOrder = (images[images.length - 1]?.sort_order ?? -1) + 1;
      const { data, error } = await supabase.from('listing_images').insert({ listing_id: id, url: pub.publicUrl, sort_order: nextOrder, is_cover: images.length === 0 }).select().single();
      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      } else {
        setImages(prev => [...prev, data as ListingImage]);
      }
    }
  }, [images, listingId, ensureDraftListing, userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 20 });

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
    if (!target) return;
    // unset previous cover
    const prevCover = images.find(i => i.is_cover);
    if (prevCover) {
      await supabase.from('listing_images').update({ is_cover: false }).eq('id', prevCover.id);
    }
    await supabase.from('listing_images').update({ is_cover: true }).eq('id', id);
    setImages(prev => prev.map(i => ({ ...i, is_cover: i.id === id })));
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
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
    <div className="space-y-3">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${isDragActive ? 'border-luxury bg-luxury/5' : 'border-muted'}`}>
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">Drag & drop photos here, or click to select</p>
        <p className="text-xs text-muted-foreground">Up to 20 images. JPG/PNG/HEIC (auto-converted).</p>
      </div>

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map(img => (
                <SortableThumb key={img.id} image={img} onDelete={handleDelete} onMakeCover={handleMakeCover} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
