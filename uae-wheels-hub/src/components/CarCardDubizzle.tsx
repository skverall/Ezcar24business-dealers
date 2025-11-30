import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, Camera, Calendar, Gauge, Fuel, Cog, MapPin, Car, Building2, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { formatSpec, formatCity } from "@/utils/formatters";
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
  if (nameParts.length === 1) return nameParts[0];

  // Return first name + first letter of last name
  const firstName = nameParts[0];
  const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

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
  location,
  isNew = false,
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
  const all = images.length > 0 ? images : [image];
  const [isFav, setIsFav] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sellerInfo, setSellerInfo] = useState<{
    name: string;
    isDealer: boolean;
    companyName?: string;
  } | null>(null);

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
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden relative">
            <img
              src={all[idx]}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {status === 'sold' && (
              <div className="absolute top-3 right-3 z-20">
                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-yellow-400 text-black shadow">SOLD</span>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          {all.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Image Count Badge */}
          {all.length > 1 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="bg-black/70 text-white border-0">
                <Camera className="h-3 w-3 mr-1" />
                {idx + 1}/{all.length}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3 md:p-4">
          <div className="space-y-3">
            {/* Price */}
            <div className="text-xl font-bold text-foreground flex items-center gap-2">
              {status === 'sold' ? (
                <>
                  <span>{soldPrice ? `Sold for AED ${Number(soldPrice).toLocaleString()}` : 'Sold'}</span>
                  {soldPrice && (
                    <span className="line-through text-muted-foreground text-base font-normal">{price}</span>
                  )}
                </>
              ) : (
                price
              )}
            </div>

            {/* Car Title - Fixed height */}
            <div className="min-h-[3rem] flex items-start">
              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Key Specifications - Fixed height */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 px-4 border-t border-border/50 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Calendar className="h-4 w-4" />
              <span className="font-medium truncate max-w-[120px]">{year || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Gauge className="h-4 w-4" />
              <span className="font-medium truncate max-w-[120px]">{mileage || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Cog className="h-4 w-4" />
              <span className="font-medium truncate max-w-[140px]">{formatSpec(spec)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <MapPin className="h-4 w-4" />
              <span className="font-medium truncate max-w-[140px]">{formatCity(location)}</span>
            </div>
          </div>

          {/* Flexible spacer to push bottom content down */}
          <div className="flex-1"></div>

          {/* Bottom Section - Fixed height */}
          <div className="space-y-3">
            {/* Seller Info - Compact layout with responsive button */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {sellerInfo?.isDealer ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground line-clamp-1" title={sellerInfo?.isDealer && sellerInfo?.companyName ? sellerInfo.companyName : sellerInfo?.name || dealer}>
                    {sellerInfo?.isDealer && sellerInfo?.companyName
                      ? sellerInfo.companyName
                      : formatUserName(sellerInfo?.name || dealer)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sellerInfo?.isDealer ? t('cars.dealer') : t('cars.individual')}
                  </p>
                </div>
              </div>

              {/* Contact Seller Button - Compact full width */}
              <Button
                variant="default"
                size="sm"
                className="w-full text-xs h-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to car detail page where user can contact seller
                  navigate(`${pathPrefix}/car/${id}`);
                }}
              >
                {t('cars.contactSeller')}
              </Button>
            </div>

            {/* Action Buttons - Fixed height */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={handleFavorite}
              >
                <Heart className={`h-4 w-4 mr-1 ${isFav ? 'fill-current text-red-500' : ''}`} />
                {t('cars.favorite')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-1" />
                {t('cars.share')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CarCardDubizzle;
