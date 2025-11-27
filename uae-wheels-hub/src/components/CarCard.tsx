import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, Calendar, Gauge, Fuel, Cog, Share2 } from "lucide-react";
import { formatSpec } from "@/utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useLongPress } from "@/hooks/useLongPress";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

interface CarCardProps {
  id: string;
  title: string;
  price: string;
  year: number;
  mileage: string;
  fuelType: string;
  spec: string;
  image: string;
  images?: string[];
  dealer: string;
  location: string;
  isNew?: boolean;
}

const CarCard = ({
  id,
  title,
  price,
  year,
  mileage,
  fuelType,
  spec,
  image,
  images = [],
  dealer,
  location,
  isNew = false
}: CarCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const all = images.length > 0 ? images : [image];
  const [idx, setIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const canPrev = all.length > 1;
  const canNext = all.length > 1;

  const prev = (e?: React.MouseEvent) => { e?.preventDefault(); e?.stopPropagation(); if (!canPrev) return; setIdx((i) => (i - 1 + all.length) % all.length); };
  const next = (e?: React.MouseEvent) => { e?.preventDefault(); e?.stopPropagation(); if (!canNext) return; setIdx((i) => (i + 1) % all.length); };

  // Long press handler for mobile
  const longPressProps = useLongPress({
    onLongPress: () => {
      setShowMobileActions(true);
      // Hide actions after 3 seconds
      setTimeout(() => setShowMobileActions(false), 3000);
    },
    threshold: 500
  });

  // Ensure we start from cover if changed
  useEffect(() => { setIdx(0); }, [image]);

  // Load favorite status when component mounts or user changes
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!user || !id) return;

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('listing_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading favorite status:', error);
          return;
        }

        setIsFav(!!data);
      } catch (err) {
        console.error('Error loading favorite status:', err);
      }
    };

    loadFavoriteStatus();
  }, [user, id]);

  const MenuWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => navigate(`/car/${id}`)}>Open</ContextMenuItem>
        <ContextMenuItem onClick={doFavoriteToggle}>{isFav ? 'Remove from Favorites' : 'Add to Favorites'}</ContextMenuItem>
        <ContextMenuItem onClick={doShare}>Share</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

    const url = `${window.location.origin}/car/${id}`;

    const doShare = async () => {
      try {
        const { shareContent } = await import('@/utils/share');
        await shareContent({ title, text: `Check out this ${title} on Ezcar24`, url, dialogTitle: 'Share Car Listing' });
      } catch {}
    };

    const doFavoriteToggle = async () => {
      if (!user) {
        toast({ title: 'Sign in required', description: 'Please sign in to manage favorites.' });
        navigate('/auth?tab=login');
        return;
      }
      try {
        if (!isFav) {
          const { error } = await supabase.from('favorites').insert({ listing_id: id, user_id: user.id });
          if (error) throw error;
          setIsFav(true);
          toast({ title: 'Added to favorites', description: `${title} saved.` });
        } else {
          const { error } = await supabase.from('favorites').delete().eq('listing_id', id).eq('user_id', user.id);
          if (error) throw error;
          setIsFav(false);
          toast({ title: 'Removed from favorites', description: `${title} removed.` });
        }
      } catch (err: any) {
        toast({ title: 'Failed to update favorites', description: err?.message ?? 'Unknown error', variant: 'destructive' });
      }
    };

  return (
    <MenuWrapper>
      <Card className="group overflow-hidden hover-lift glass-effect border-luxury/10 animate-fade-in-up h-full flex flex-col">
      {/* Zone 1: Image - Fixed aspect ratio */}
      <div className="relative overflow-hidden aspect-[4/3] flex-shrink-0" {...longPressProps}>
        <img
          src={all[idx]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        {/* Hover arrows (desktop only) */}
        {all.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-auto"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-auto"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        <div className="absolute top-4 left-4 flex gap-2">
          {isNew && <Badge variant="destructive" className="animate-pulse shadow-lg">New</Badge>}
        </div>

        {/* Mobile hint - only show on touch devices and first few cards */}
        <div className="md:hidden absolute bottom-4 left-4 opacity-20 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
          <div className="text-xs text-white bg-black/60 px-2 py-1 rounded-full backdrop-blur border border-white/20">
            💡 Hold for options
          </div>
        </div>
        {/* Action buttons container - hidden by default, shown on hover (desktop) or tap (mobile) */}
        <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 md:group-hover:opacity-100 car-card-actions car-card-actions-desktop transform translate-y-2 md:group-hover:translate-y-0 pointer-events-none md:group-hover:pointer-events-auto">
          {/* Favorite toggle */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="glass-effect hover:bg-luxury/20 text-foreground hover:text-luxury transition-all duration-300 hover:scale-110 pointer-events-auto touch-manipulation"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                toast({ title: 'Sign in required', description: 'Please sign in to manage favorites.' });
                navigate('/auth?tab=login');
                return;
              }
              try {
                if (!isFav) {
                  const { error } = await supabase
                    .from('favorites')
                    .insert({ listing_id: id, user_id: user.id });
                  if (error) throw error;
                  setIsFav(true);
                  toast({ title: 'Added to favorites', description: `${title} saved.` });
                } else {
                  const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('listing_id', id)
                    .eq('user_id', user.id);
                  if (error) throw error;
                  setIsFav(false);
                  toast({ title: 'Removed from favorites', description: `${title} removed.` });
                }
              } catch (err: any) {
                toast({ title: 'Failed to update favorites', description: err?.message ?? 'Unknown error', variant: 'destructive' });
              }
            }}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-red-500' : ''}`} />
          </Button>
          {/* Share button */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="glass-effect hover:bg-luxury/20 text-foreground hover:text-luxury transition-all duration-300 hover:scale-110 pointer-events-auto touch-manipulation"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/car/${id}`;

              try {
                const { shareContent } = await import('@/utils/share');
                const shared = await shareContent({
                  title: title,
                  text: `Check out this ${title} on Ezcar24`,
                  url: url,
                  dialogTitle: 'Share Car Listing'
                });

                // If shareContent returns false, it means clipboard fallback was used
                if (!shared) {
                  toast({
                    title: 'Link copied',
                    description: 'The listing link is in your clipboard.'
                  });
                }
              } catch (err) {
                console.error('Share failed:', err);
                // Final fallback - try to copy to clipboard
                try {
                  await navigator.clipboard.writeText(url);
                  toast({
                    title: 'Link copied',
                    description: 'The listing link is in your clipboard.'
                  });
                } catch (clipboardErr) {
                  toast({
                    title: 'Share failed',
                    description: 'Unable to share or copy link.',
                    variant: 'destructive'
                  });
                }
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile-only: Touch overlay to show actions */}
        <div className={`md:hidden absolute inset-0 z-20 transition-opacity duration-300 bg-black/20 flex items-start justify-end p-4 gap-2 pointer-events-auto car-card-mobile-overlay ${showMobileActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Favorite toggle - mobile */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="glass-effect bg-background/90 hover:bg-luxury/20 text-foreground hover:text-luxury transition-all duration-300 hover:scale-110 pointer-events-auto touch-manipulation"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                toast({ title: 'Sign in required', description: 'Please sign in to manage favorites.' });
                navigate('/auth?tab=login');
                return;
              }
              try {
                if (!isFav) {
                  const { error } = await supabase
                    .from('favorites')
                    .insert({ listing_id: id, user_id: user.id });
                  if (error) throw error;
                  setIsFav(true);
                  toast({ title: 'Added to favorites', description: `${title} saved.` });
                } else {
                  const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('listing_id', id)
                    .eq('user_id', user.id);
                  if (error) throw error;
                  setIsFav(false);
                  toast({ title: 'Removed from favorites', description: `${title} removed.` });
                }
              } catch (err: any) {
                toast({ title: 'Failed to update favorites', description: err?.message ?? 'Unknown error', variant: 'destructive' });
              }
            }}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-red-500' : ''}`} />
          </Button>
          {/* Share button - mobile */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="glass-effect bg-background/90 hover:bg-luxury/20 text-foreground hover:text-luxury transition-all duration-300 hover:scale-110 pointer-events-auto touch-manipulation"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/car/${id}`;

              try {
                const { shareContent } = await import('@/utils/share');
                const shared = await shareContent({
                  title: title,
                  text: `Check out this ${title} on Ezcar24`,
                  url: url,
                  dialogTitle: 'Share Car Listing'
                });

                // If shareContent returns false, it means clipboard fallback was used
                if (!shared) {
                  toast({
                    title: 'Link copied',
                    description: 'The listing link is in your clipboard.'
                  });
                }
              } catch (err) {
                console.error('Share failed:', err);
                // Final fallback - try to copy to clipboard
                try {
                  await navigator.clipboard.writeText(url);
                  toast({
                    title: 'Link copied',
                    description: 'The listing link is in your clipboard.'
                  });
                } catch (clipboardErr) {
                  toast({
                    title: 'Share failed',
                    description: 'Unable to share or copy link.',
                    variant: 'destructive'
                  });
                }
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
          <div className="flex items-center gap-2">
            {all.length > 1 && (
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-full border border-border">
                {idx + 1} / {all.length}
              </div>
            )}
            <Link to={`/car/${id}`} className="flex-1">
              <Button variant="luxury" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Zone 2: Content - Flexible with minimum height */}
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Title and location - Fixed height zone */}
        <div className="mb-4 h-[4.5rem] flex flex-col justify-start">
          <h3 className="font-bold text-lg sm:text-xl text-foreground mb-2 group-hover:text-luxury transition-colors duration-300 line-clamp-2 leading-tight flex-shrink-0">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 line-clamp-1 mt-auto">
            <span className="w-2 h-2 bg-luxury rounded-full animate-pulse flex-shrink-0"></span>
            <span className="truncate">{dealer} • {location}</span>
          </p>
        </div>

        {/* Metadata grid - Fixed height zone */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 text-sm h-[5rem]">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 h-10">
            <Calendar className="h-4 w-4 text-luxury flex-shrink-0" />
            <span className="font-medium truncate">{year || '—'}</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 h-10">
            <Gauge className="h-4 w-4 text-luxury flex-shrink-0" />
            <span className="font-medium truncate">{mileage || '—'}</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 h-10">
            <Fuel className="h-4 w-4 text-luxury flex-shrink-0" />
            <span className="font-medium truncate">{fuelType}</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 h-10">
            <Cog className="h-4 w-4 text-luxury flex-shrink-0" />
            <span className="font-medium truncate">{formatSpec(spec)}</span>
          </div>
        </div>

        {/* Zone 3: Bottom panel - Fixed height */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto h-[4rem]">
          <div className="text-2xl sm:text-3xl font-bold gradient-text truncate pr-2">
            {price}
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Link to={`/car/${id}`}>
              <Button variant="ghost" size="sm" className="hover:scale-110 transition-transform">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={`/car/${id}`}>
              <Button variant="luxury" size="sm" className="hover-lift">
                Contact
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
    </MenuWrapper>

export default React.memo(CarCard);