import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, Camera, Calendar, Gauge, Fuel, Cog, Building2, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { formatSpec } from "@/utils/formatters";
import { useTranslation } from "react-i18next";
import { useHaptics } from "@/hooks/useHaptics";
import { shareContent } from "@/utils/share";

interface CarCardDubizzleProps {
  id: string;
  title: string;
  price: string;
  year: number;
  mileage: string;
  fuelType: string;
  spec?: string;
  image: string;
  images?: string[];
  dealer: string;
  location: string;
  isNew?: boolean;
  sellerId?: string;
  status?: string;
  soldPrice?: number | null;
}

// Utility function to format user names (First Name + Last Initial)
// Examples:
// "Shokhabbos Vokhidjon Ugli Makhmudov" → "Shokhabbos M."
// "John Smith" → "John S."
// "Ahmed" → "Ahmed"
// "" → "Unknown"
const formatUserName = (fullName: string): string => {
  if (!fullName || fullName.trim() === '') return 'Unknown';

  const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);

  if (nameParts.length === 0) return 'Unknown';
  if (nameParts.length === 1) return nameParts[0] ?? 'Unknown';

  // Return first name + first letter of last name
  const firstName = nameParts[0] ?? 'Unknown';
  const lastName = nameParts[nameParts.length - 1] ?? '';
  const lastNameInitial = lastName.charAt(0).toUpperCase();

  return `${firstName} ${lastNameInitial}.`;
};

const CarCardDubizzle = ({
  id,
  title,
  price,
  year,
  mileage,
  fuelType,
  spec = "",
  image,
  images = [],
  dealer,
  location: _location,
  isNew: _isNew = false,
  sellerId,
  status,
  soldPrice
}: CarCardDubizzleProps) => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { t } = useTranslation();
  const pathPrefix = routerLocation.pathname.startsWith('/en') ? '/en' : routerLocation.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const { user } = useAuth();
  const { toast } = useToast();
  const { cardTap, favoriteToggle, buttonPress } = useHaptics();
  const placeholderImage = '/placeholder.svg';
  const all = useMemo(() => {
    const baseImages = images && images.length > 0 ? images : [image];
    const filtered = baseImages.filter((url): url is string => Boolean(url));
    return filtered.length > 0 ? filtered : [placeholderImage];
  }, [image, images, placeholderImage]);
  const [isFav, setIsFav] = useState(false);
  const [idx, setIdx] = useState(0);
  const [imageSrc, setImageSrc] = useState(all[0] || placeholderImage);
  const [sellerInfo, setSellerInfo] = useState<{
    name: string;
    isDealer: boolean;
    companyName?: string;
  } | null>(null);

  useEffect(() => {
    // Reset index and image when available images change (e.g., after data fetch)
    setIdx(0);
    setImageSrc(all[0] || placeholderImage);
  }, [all]);

  useEffect(() => {
    setImageSrc(all[idx] || placeholderImage);
  }, [all, idx]);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (all.length <= 1) return;
    setIdx((i) => (i - 1 + all.length) % all.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (all.length <= 1) return;
    setIdx((i) => (i + 1) % all.length);
  };

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

  // Load seller information
  useEffect(() => {
    const loadSellerInfo = async () => {
      if (!sellerId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, is_dealer, company_name')
          .eq('user_id', sellerId)
          .single();

        if (error) {
          console.error('Error loading seller info:', error);
          return;
        }

        const row = data as any;
        setSellerInfo({
          name: row.full_name || 'Unknown',
          isDealer: !!row.is_dealer,
          companyName: row.company_name
        });
      } catch (err) {
        console.error('Error loading seller info:', err);
      }
    };

    loadSellerInfo();
  }, [sellerId]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger haptic feedback
    await favoriteToggle();

    if (!user) {
      toast({ title: t('nav.signIn'), description: t('cars.favorite') });
      navigate(`${pathPrefix}/auth?tab=login`);
      return;
    }

    try {
      if (!isFav) {
        const { error } = await supabase
          .from('favorites')
          .insert({ listing_id: id, user_id: user.id });
        if (error) throw error;
        setIsFav(true);
        toast({ title: t('cars.favorite'), description: `${title}` });
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('listing_id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setIsFav(false);
        toast({ title: t('cars.favorite'), description: `${title}` });
      }
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message ?? 'Unknown error', variant: 'destructive' });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger haptic feedback
    await buttonPress();

    const url = `${window.location.origin}${pathPrefix}/car/${id}`;

    try {
      const result = await shareContent({
        title: title,
        text: `Check out this ${title} on Ezcar24`,
        url: url,
        dialogTitle: 'Share Car Listing'
      });

      if (!result) {
        toast({
          title: t('cars.share'),
          description: 'The listing link is in your clipboard.'
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: t('cars.share'),
          description: 'The listing link is in your clipboard.'
        });
      } catch (clipboardErr) {
        toast({
          title: 'فشل المشاركة',
          description: 'تعذر مشاركة الرابط أو نسخه.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleCardClick = async () => {
    await cardTap();
  };

  return (
    <Link to={`${pathPrefix}/car/${id}`} onClick={handleCardClick}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
        <div className="relative">
          {/* Changed aspect ratio to 16/10 for a more compact look */}
          <div className="aspect-[16/10] overflow-hidden relative">
            <img
              src={imageSrc}
              alt={title}
              onError={() => {
                if (imageSrc !== placeholderImage) {
                  setImageSrc(placeholderImage);
                }
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {status === 'sold' && (
              <div className="absolute top-2 right-2 z-20">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-yellow-400 text-black shadow-sm">SOLD</span>
              </div>
            )}

            {/* Gradient overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Navigation arrows */}
          {all.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Image Count Badge */}
          {all.length > 1 && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-0 h-5 px-1.5 text-[10px]">
                <Camera className="h-3 w-3 mr-1" />
                {idx + 1}/{all.length}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Price & Title Row */}
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight mb-1">
                  {title}
                </h3>
                <div className="text-lg font-bold text-primary flex items-center gap-2">
                  {status === 'sold' ? (
                    <>
                      <span className="text-base">{soldPrice ? `AED ${Number(soldPrice).toLocaleString()}` : 'Sold'}</span>
                    </>
                  ) : (
                    price
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Specifications - Compact Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-2.5 my-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{year || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Gauge className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{mileage || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Cog className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{formatSpec(spec)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Fuel className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate capitalize">{fuelType}</span>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="space-y-2.5 pt-1">
            {/* Seller Info */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
                  {sellerInfo?.isDealer ? (
                    <Building2 className="h-3 w-3 text-primary/70" />
                  ) : (
                    <User className="h-3 w-3 text-primary/70" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground/90 line-clamp-1" title={sellerInfo?.isDealer && sellerInfo?.companyName ? sellerInfo.companyName : sellerInfo?.name || dealer}>
                    {sellerInfo?.isDealer && sellerInfo?.companyName
                      ? sellerInfo.companyName
                      : formatUserName(sellerInfo?.name || dealer)}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                  onClick={handleFavorite}
                >
                  <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Contact Seller Button */}
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs h-8 font-medium shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`${pathPrefix}/car/${id}`);
              }}
            >
              {t('cars.contactSeller')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CarCardDubizzle;
