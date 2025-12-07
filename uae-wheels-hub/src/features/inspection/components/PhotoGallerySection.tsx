import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2 } from 'lucide-react';

interface Photo {
  storage_path: string;
  label?: string;
}

interface PhotoGallerySectionProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  onUpload: (files: FileList) => Promise<void>;
  readOnly?: boolean;
  saving?: boolean;
}

export const PhotoGallerySection: React.FC<PhotoGallerySectionProps> = ({
  photos,
  onPhotosChange,
  onUpload,
  readOnly,
  saving,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onUpload(files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handlePhotoDelete = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="md:col-span-12 print-col-12">
      <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm card-print-clean">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-luxury" />
            Inspection Photos
          </h3>
          <div className="flex items-center gap-2 print:hidden">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={readOnly || saving}
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl print:hidden">
            No photos added yet
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print-photos-grid">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-xl overflow-hidden bg-muted print-photo-item print-break-inside-avoid"
              >
                <img
                  src={photo.storage_path}
                  alt={photo.label || 'Car photo'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
                  {!readOnly && (
                    <Button variant="destructive" size="icon" onClick={() => handlePhotoDelete(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {photo.label && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                    {photo.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
