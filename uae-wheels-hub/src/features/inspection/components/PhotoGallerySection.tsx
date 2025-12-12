import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from '@/components/ui/carousel';

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Sync carousel with current index when opening
  useEffect(() => {
    if (carouselApi && lightboxOpen) {
      carouselApi.scrollTo(currentPhotoIndex, true);
    }
  }, [carouselApi, lightboxOpen, currentPhotoIndex]);

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

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="md:col-span-12 print-col-12">
        <div className="bg-card rounded-2xl p-6 border border-border/70 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)] card-print-clean">
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
                className="rounded-md"
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
                  className="relative group aspect-square rounded-xl overflow-hidden bg-muted print-photo-item print-break-inside-avoid cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.storage_path}
                    alt={photo.label || 'Car photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Photo Controls Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                    {!readOnly && (
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePhotoDelete(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] bg-transparent border-0 shadow-none p-0 flex items-center justify-center outline-none">
          <div className="relative w-full h-full flex items-center justify-center outline-none">
            <Carousel setApi={setCarouselApi} className="w-full max-w-4xl" opts={{ loop: true }}>
              <CarouselContent>
                {photos.map((photo, index) => (
                  <CarouselItem key={index} className="flex items-center justify-center h-full">
                    <div className="relative max-h-[85vh] w-auto">
                      <img
                        src={photo.storage_path}
                        alt={photo.label || `Photo ${index + 1}`}
                        className="max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl"
                      />
                      {photo.label && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                          {photo.label}
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4 md:-left-12 border-none bg-black/50 text-white hover:bg-black/70 hover:text-white" />
              <CarouselNext className="hidden sm:flex -right-4 md:-right-12 border-none bg-black/50 text-white hover:bg-black/70 hover:text-white" />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
