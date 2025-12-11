import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Heart, Share2, Gauge, Fuel, Users, Shield, Star, Car, FileText, BadgeCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { trackCarView, trackCarFavorite, trackCarShare } from "@/components/GoogleAnalytics";
import { capitalizeFirst, formatMake, formatSpec, formatCity, formatTransmission, formatFuelType, formatCondition } from "@/utils/formatters";
import { useTranslation } from "react-i18next";
import SellerActionCard from "@/components/SellerActionCard";
import CarKeySpecs from "@/components/CarKeySpecs";
import CarFeatureGroups from "@/components/CarFeatureGroups";
import ExpandableDescription from "@/components/ExpandableDescription";
import { getProxiedImageUrl } from "@/utils/imageUrl";
import { AdminApi } from "@/utils/adminApi";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const CarDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { user: adminUser, isAuthenticated: isAdmin } = useAdminAuth();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const { user } = useAuth();
  const [dbCar, setDbCar] = useState<any | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidUUID, setIsValidUUID] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxApi, setLightboxApi] = useState<CarouselApi | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reportShareSlug, setReportShareSlug] = useState<string | null>(null);

  // When opening lightbox, scroll it to current index
  useEffect(() => {
    if (lightboxApi && lightboxOpen) {
      lightboxApi.scrollTo(currentIndex, true);
    }
  }, [lightboxApi, lightboxOpen, currentIndex]);

  // Keep main and lightbox carousels in sync
  useEffect(() => {
    if (!lightboxApi) return;
    const onSelect = () => {
      const idx = lightboxApi.selectedScrollSnap();
      setCurrentIndex(idx);
    };
    lightboxApi.on('select', onSelect);
    return () => {
      lightboxApi.off?.('select', onSelect);
    };
  }, [lightboxApi]);

  // Check if ID is a valid UUID
  useEffect(() => {
    if (!id) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    setIsValidUUID(uuidRegex.test(id));
  }, [id]);

  useEffect(() => {
    const fetchFromDb = async () => {
      if (!id || !isValidUUID) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('is_draft', false)
        .in('status', ['active', 'sold'])
        .is('deleted_at', null)
        .maybeSingle();

      if (!error && data) {
        setDbCar(data);

        // Increment view count (fire and forget - don't block UI)
        const incrementViews = async () => {
          try {
            await supabase
              .from('listings')
              .update({ views: ((data as any).views || 0) + 1 } as any)
              .eq('id', id);

            // Silently update local state to reflect the increment
            setDbCar((prev: any) => prev ? { ...prev, views: ((prev as any).views || 0) + 1 } : prev);
          } catch (err) {
            // Silently ignore view tracking errors
            console.warn('Failed to track view:', err);
          }
        };
        incrementViews();

        // Track car view in Google Analytics
        trackCarView(data.id, `${data.year} ${formatMake(data.make)} ${capitalizeFirst(data.model)}`);
      }
      setLoading(false);
    };
    fetchFromDb();
  }, [id, isValidUUID]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!dbCar?.id) return;
      const { data } = await supabase
        .from('listing_images')
        .select('url, is_cover, sort_order')
        .eq('listing_id', dbCar.id)
        .order('is_cover', { ascending: false })
        .order('sort_order', { ascending: true });
      setImages((data || []).map((i: any) => getProxiedImageUrl(i.url)));
    };
    fetchImages();
  }, [dbCar?.id]);

  // Load favorite status
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

        setIsFavorite(!!data);
      } catch (err) {
        console.error('Error loading favorite status:', err);
      }
    };

    loadFavoriteStatus();
  }, [user, id]);

  // Load linked report's share slug if available
  useEffect(() => {
    const loadReportSlug = async () => {
      if (!dbCar?.report_id) {
        setReportShareSlug(null);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('reports')
          .select('share_slug, status')
          .eq('id', dbCar.report_id)
          .eq('status', 'frozen')
          .maybeSingle();

        if (!error && data?.share_slug) {
          setReportShareSlug(data.share_slug);
        } else {
          setReportShareSlug(null);
        }
      } catch (err) {
        console.error('Error loading report slug:', err);
        setReportShareSlug(null);
      }
    };

    loadReportSlug();
  }, [dbCar?.report_id]);

  if (!isValidUUID || (!loading && !dbCar)) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title={t('carDetail.notFoundTitle')} noIndex={true} />
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">{t('carDetail.notFoundTitle')}</h1>
          <p className="text-muted-foreground mb-8">
            {!isValidUUID ? t('carDetail.invalidId') : t('carDetail.notFoundDesc')}
          </p>
          <Link to={`${pathPrefix}/browse`}>
            <Button variant="luxury">{t('nav.explore')}</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-luxury mx-auto"></div>
          <p className="text-muted-foreground mt-4">{t('carDetail.loading')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${dbCar?.title || 'Car Listing'} - ${dbCar?.year || ''} ${formatMake(dbCar?.make)} ${capitalizeFirst(dbCar?.model)}`}
        description={`${dbCar?.title || 'Car'} for sale in ${formatCity(dbCar?.city)}. ${dbCar?.year || ''} ${formatMake(dbCar?.make)} ${capitalizeFirst(dbCar?.model)} with ${dbCar?.mileage || ''} mileage. Price: ${dbCar?.price || 'Contact for price'}. Contact seller for more details.`}
        keywords={`${formatMake(dbCar?.make)} ${capitalizeFirst(dbCar?.model)}, ${dbCar?.year || ''} ${formatMake(dbCar?.make)}, cars for sale UAE, ${formatMake(dbCar?.make)} UAE, used cars ${formatCity(dbCar?.city)}`}
        image={images[0]}
        url={`https://ezcar24.com/car/${id}`}
        type="product"
      />
      <Header />

      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-8 sm:pt-32 sm:pb-12">
        {/* Breadcrumb */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0">
          <Breadcrumb className="mb-4 sm:mb-8 min-w-max">
            <BreadcrumbList className="text-base sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={pathPrefix} className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.home')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`${pathPrefix}/browse`} className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.explore')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground">{dbCar?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>





        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1280px] mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Main Images - 1-2 large photos */}
            <Card className="overflow-hidden glass-effect border-luxury/10 mx-auto max-w-2xl">
              <div className="relative">
                {images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main large image */}
                    <div className="relative group">
                      <div className="w-full min-h-[240px] max-h-[320px] sm:min-h-[280px] sm:max-h-[380px] lg:min-h-[320px] lg:max-h-[420px] flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
                        <img
                          src={images[currentIndex]}
                          alt={`${dbCar?.title ?? 'Car'} view ${currentIndex + 1}`}
                          loading="eager"
                          fetchPriority="high"
                          className="max-w-full max-h-full object-contain cursor-zoom-in"
                          onClick={() => {
                            setLightboxOpen(true);
                          }}
                        />
                      </div>

                      {/* Navigation arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
                              setCurrentIndex(newIndex);
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                            aria-label="Previous image"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
                              setCurrentIndex(newIndex);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                            aria-label="Next image"
                          >
                            ›
                          </button>
                        </>
                      )}

                      {/* Image counter */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 right-4">
                          <Badge variant="secondary" className="bg-black/70 text-white border-0">
                            {currentIndex + 1}/{images.length}
                          </Badge>
                        </div>
                      )}
                      {dbCar?.year && (new Date().getFullYear() - dbCar.year) <= 1 && (
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge variant="destructive" className="animate-pulse shadow-lg">{t('carDetail.badges.new')}</Badge>
                          <Badge variant="secondary" className="glass-effect">{t('carDetail.badges.excellent')}</Badge>
                        </div>
                      )}
                      {dbCar?.status === 'sold' && (
                        <div className="absolute top-4 right-4">
                          <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-yellow-400 text-black shadow">SOLD</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all duration-300"
                          onClick={async () => {
                            if (!user) {
                              toast({
                                title: t('nav.signIn'),
                                description: t('cars.favorite')
                              });
                              return;
                            }

                            try {
                              if (!isFavorite) {
                                const { error } = await supabase
                                  .from('favorites')
                                  .insert({ listing_id: id, user_id: user.id });
                                if (error) throw error;
                                setIsFavorite(true);
                                trackCarFavorite(id, 'add');
                                toast({
                                  title: t('cars.favorite'),
                                  description: `${dbCar?.title || 'Car'}`
                                });
                              } else {
                                const { error } = await supabase
                                  .from('favorites')
                                  .delete()
                                  .eq('listing_id', id)
                                  .eq('user_id', user.id);
                                if (error) throw error;
                                setIsFavorite(false);
                                trackCarFavorite(id, 'remove');
                                toast({
                                  title: t('cars.favorite'),
                                  description: `${dbCar?.title || 'Car'}`
                                });
                              }
                            } catch (err: any) {
                              toast({
                                title: 'Failed to update favorites',
                                description: err?.message ?? 'Unknown error',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all duration-300"
                          onClick={async () => {
                            const url = window.location.href;
                            const title = dbCar?.title || 'Car Listing';

                            try {
                              const { shareContent } = await import('@/utils/share');
                              const shared = await shareContent({
                                title: title,
                                text: `${title}`,
                                url: url,
                                dialogTitle: t('cars.share')
                              });

                              // Track share event
                              if (dbCar?.id) {
                                trackCarShare(dbCar.id, shared ? 'native' : 'clipboard');
                              }

                              // If shareContent returns false, it means clipboard fallback was used
                              if (!shared) {
                                toast({
                                  title: t('cars.share'),
                                  description: 'The listing link is copied.'
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
                                  title: 'فشل المشاركة',
                                  description: 'تعذر مشاركة الرابط أو نسخه.',
                                  variant: 'destructive'
                                });
                              }
                            }
                          }}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>


                  </div>
                ) : (
                  <div className="w-full h-96 bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">{t('carDetail.noImage')}</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <>
                  <div className="border-t border-border/50"></div>
                  <div className="p-4 pt-6">
                    <h3 className="text-lg font-semibold mb-3">{t('carDetail.morePhotos', { count: images.length - 1 })}</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {images.slice(1).map((img: string, index: number) => (
                        <img
                          key={index + 1}
                          src={img}
                          alt={`${dbCar?.title ?? 'Car'} ${index + 2}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity hover:ring-2 hover:ring-luxury"
                          onClick={() => {
                            setCurrentIndex(index + 1);
                            setLightboxOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Key Specs - Moved under photos */}
            <CarKeySpecs
              year={dbCar?.year}
              mileage={dbCar?.mileage}
              fuelType={dbCar?.fuel_type}
              spec={dbCar?.spec}
              city={dbCar?.city}
              bodyType={dbCar?.body_type}
              className="mx-auto max-w-2xl"
            />

            {/* Lightbox Dialog */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-5xl bg-transparent border-0 shadow-none p-0">
                <Carousel setApi={setLightboxApi} opts={{ loop: true }}>
                  <CarouselContent>
                    {images.map((img: string, index: number) => (
                      <CarouselItem key={index} className="flex items-center justify-center">
                        <img
                          src={img}
                          alt={`${dbCar?.title ?? 'Car'} ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[80vh] w-auto object-contain"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </DialogContent>
            </Dialog>

            {/* Car Title */}
            <div className="mx-auto max-w-2xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                      {dbCar?.year} {formatMake(dbCar?.make)} {capitalizeFirst(dbCar?.model)}
                    </h1>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 border border-blue-100/50">
                      <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{t('carDetailExtras.verified')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {dbCar?.status === 'sold' ? (
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="destructive" className="text-sm px-3 py-1 font-bold uppercase tracking-wider shadow-sm">
                        SOLD
                      </Badge>
                      {dbCar?.sold_at && (
                        <span className="text-xs text-muted-foreground">
                          Sold on {new Date(dbCar.sold_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl lg:text-3xl font-bold gradient-text">
                      {dbCar?.price ? `AED ${dbCar.price.toLocaleString()}` : t('carDetailExtras.priceOnRequest')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inspection Report Button - shows if report is linked */}
            {reportShareSlug && (
              <div className="mx-auto max-w-2xl">
                <Link to={`/report/${reportShareSlug}`} target="_blank">
                  <Button
                    variant="outline"
                    className="w-full gap-3 h-14 text-base font-medium bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all"
                  >
                    <FileText className="h-5 w-5" />
                    View Inspection Report
                    <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 text-xs">
                      Verified
                    </Badge>
                  </Button>
                </Link>
              </div>
            )}

            {/* Car Description - Moved up */}
            <Card className="glass-effect border-luxury/10 mx-auto max-w-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5 text-luxury" />
                  {t('carDetail.about')}
                </h2>
                <ExpandableDescription
                  description={dbCar?.description || t('carDetail.defaultDescription')}
                  maxLength={300}
                />
              </CardContent>
            </Card>

            {/* Car Features */}
            <CarFeatureGroups className="mx-auto max-w-2xl" features={dbCar?.tags || []} />

            {/* Essential Specifications - Enhanced */}
            {(() => {
              const details: Array<{ icon: any, label: string, value: string }> = [];
              const mm = `${formatMake(dbCar?.make)} ${capitalizeFirst(dbCar?.model)}`.trim();

              if (mm && !mm.startsWith('Toyota Model')) details.push({ icon: Car, label: t('carDetail.fields.makeModel'), value: mm });

              const spec = formatSpec(dbCar?.spec);
              if (spec && spec !== 'GCC Spec') details.push({ icon: Shield, label: t('carDetail.fields.spec'), value: spec });

              const cond = formatCondition(dbCar?.condition);
              if (cond && cond !== 'Used') details.push({ icon: Star, label: t('carDetail.fields.condition'), value: cond });

              if (dbCar?.transmission) details.push({ icon: Gauge, label: t('carDetail.fields.transmission'), value: formatTransmission(dbCar?.transmission) });
              if (dbCar?.fuel_type) details.push({ icon: Fuel, label: t('carDetail.fields.fuel'), value: formatFuelType(dbCar?.fuel_type) });
              if (dbCar?.body_type) details.push({ icon: Car, label: t('carDetail.fields.body'), value: capitalizeFirst(dbCar?.body_type) });
              if (dbCar?.owners_count != null) details.push({ icon: Users, label: t('carDetail.fields.owners'), value: String(dbCar?.owners_count) });
              if (dbCar?.warranty) details.push({ icon: Shield, label: t('carDetail.fields.warranty'), value: capitalizeFirst(dbCar?.warranty) });
              if (dbCar?.accident_history) details.push({ icon: Shield, label: t('carDetail.fields.accident'), value: capitalizeFirst(dbCar?.accident_history) });

              if (details.length === 0) return null;

              return (
                <Card className="glass-effect border-luxury/10 mx-auto max-w-2xl shadow-md">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Car className="h-5 w-5 text-luxury" />
                      {t('carDetail.essentialDetails')}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                      {details.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-secondary/50 text-luxury shrink-0 mt-0.5">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                            <p className="font-semibold text-sm leading-tight">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-3 lg:space-y-4 lg:mt-4">
            <SellerActionCard
              listingId={id!}
              sellerId={dbCar?.user_id}
              sellerName={dbCar?.user_name}
              sellerAvatar={dbCar?.user_avatar} // Assuming this might be available or handled inside component
              phoneNumber={dbCar?.phone || '+971 50 123 4567'}
              whatsappNumber={dbCar?.whatsapp}
              isFavorite={isFavorite}
              onToggleFavorite={async () => {
                if (!user) {
                  toast({
                    title: t('nav.signIn'),
                    description: t('cars.favorite')
                  });
                  return;
                }

                try {
                  if (!isFavorite) {
                    const { error } = await supabase
                      .from('favorites')
                      .insert({ listing_id: id, user_id: user.id });
                    if (error) throw error;
                    setIsFavorite(true);
                    trackCarFavorite(id!, 'add');
                    toast({
                      title: t('cars.favorite'),
                      description: `${dbCar?.title || 'Car'}`
                    });
                  } else {
                    const { error } = await supabase
                      .from('favorites')
                      .delete()
                      .eq('listing_id', id)
                      .eq('user_id', user.id);
                    if (error) throw error;
                    setIsFavorite(false);
                    trackCarFavorite(id!, 'remove');
                    toast({
                      title: t('cars.favorite'),
                      description: `${dbCar?.title || 'Car'}`
                    });
                  }
                } catch (err: any) {
                  toast({
                    title: 'Failed to update favorites',
                    description: err?.message ?? 'Unknown error',
                    variant: 'destructive'
                  });
                }
              }}
              carTitle={dbCar?.title || 'Car Listing'}
              user={user}
              isAdmin={isAdmin}
              isSold={dbCar?.status === 'sold'}
              onUnmarkSold={async () => {
                try {
                  if (!adminUser?.id || !dbCar?.id) {
                    toast({ title: 'Admin required', description: 'Please login as admin.', variant: 'destructive' });
                    return;
                  }
                  const res = await AdminApi.unmarkListingSold(dbCar.id, adminUser.id);
                  if (!res.success) {
                    toast({ title: 'Failed', description: res.error || 'Failed to unmark sold', variant: 'destructive' });
                  } else {
                    toast({ title: 'Listing restored', description: 'Sale mark removed' });
                    setDbCar((prev: any) => prev ? { ...prev, status: 'active', sold_price: null, sold_at: null } : prev);
                  }
                } catch (e: any) {
                  toast({ title: 'Failed', description: e?.message || 'Network error', variant: 'destructive' });
                }
              }}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CarDetail;
