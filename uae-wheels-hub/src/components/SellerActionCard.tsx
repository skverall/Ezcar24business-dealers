import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Phone,
    MessageSquare,
    Share2,
    Heart,
    Star,
    MapPin,
    Shield,
    Building2,
    User,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { trackCarContact, trackCarFavorite, trackCarShare } from '@/components/GoogleAnalytics';

interface SellerActionCardProps {
    listingId: string;
    sellerId: string;
    sellerName: string;
    sellerAvatar?: string;
    phoneNumber: string;
    whatsappNumber?: string;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    carTitle: string;
    className?: string;
    user: any; // Current logged in user
    isAdmin?: boolean;
    onUnmarkSold?: () => void;
    isSold?: boolean;
}

const SellerActionCard: React.FC<SellerActionCardProps> = ({
    listingId,
    sellerId,
    sellerName,
    sellerAvatar,
    phoneNumber,
    whatsappNumber,
    isFavorite,
    onToggleFavorite,
    carTitle,
    className,
    user,
    isAdmin,
    onUnmarkSold,
    isSold
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';

    const [sellerInfo, setSellerInfo] = useState<{
        name: string;
        isDealer: boolean;
        companyName?: string;
        avatarUrl?: string;
        verificationStatus?: string;
        rating?: number;
        reviewCount?: number;
        memberSince?: string;
    } | null>(null);

    const [showContactOptions, setShowContactOptions] = useState(false);

    useEffect(() => {
        const loadSellerInfo = async () => {
            if (!sellerId) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, is_dealer, company_name, avatar_url, created_at, verification_status')
                    .eq('user_id', sellerId)
                    .single();

                if (error) throw error;

                // Cast to any to avoid strict type checking issues with Supabase generated types
                const profile = data as any;

                // Mock rating data for now as it's not in the profile table yet
                // In a real app, this would come from a reviews table
                const mockRating = 4.8;
                const mockReviewCount = 12;

                setSellerInfo({
                    name: profile.full_name || 'Unknown User',
                    isDealer: !!profile.is_dealer,
                    companyName: profile.company_name,
                    avatarUrl: profile.avatar_url ? getProxiedImageUrl(profile.avatar_url) : undefined,
                    verificationStatus: profile.verification_status,
                    rating: mockRating,
                    reviewCount: mockReviewCount,
                    memberSince: profile.created_at
                });
            } catch (err) {
                console.error('Error loading seller info:', err);
            }
        };

        loadSellerInfo();
    }, [sellerId]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleContactClick = () => {
        setShowContactOptions(!showContactOptions);
    };

    const handleCall = () => {
        if (!user) {
            toast({
                title: t('nav.signIn'),
                description: t('carDetail.signInToContact')
            });
            navigate(`${pathPrefix}/auth?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        trackCarContact(listingId, 'phone');
        window.location.href = `tel:${phoneNumber}`;
    };

    const handleWhatsApp = () => {
        if (!user) {
            toast({
                title: t('nav.signIn'),
                description: t('carDetail.signInToContact')
            });
            navigate(`${pathPrefix}/auth?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        trackCarContact(listingId, 'whatsapp');
        const cleanNumber = (whatsappNumber || phoneNumber).replace(/\s+/g, '').replace(/[^\d+]/g, '');
        const message = encodeURIComponent(`Hi! I'm interested in your car listing: ${carTitle} on EzCar24.`);
        window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    };

    const handleChat = () => {
        if (!user) {
            toast({
                title: t('nav.signIn'),
                description: t('carDetail.signInToContact')
            });
            navigate(`${pathPrefix}/auth?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        trackCarContact(listingId, 'chat');
        navigate(`${pathPrefix}/messages?listingId=${listingId}&sellerId=${sellerId}`);
    };

    const handleShare = async () => {
        const url = window.location.href;
        const title = carTitle;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: `Check out this ${title} on EzCar24`,
                    url: url,
                });
                trackCarShare(listingId, 'native');
            } else {
                await navigator.clipboard.writeText(url);
                toast({
                    title: 'Link copied',
                    description: 'The listing link is in your clipboard.'
                });
                trackCarShare(listingId, 'clipboard');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    return (
        <Card className={`glass-effect border-luxury/10 overflow-hidden ${className}`}>
            {/* Header / Seller Profile */}
            <div className="p-5 bg-gradient-to-b from-luxury/5 to-transparent">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                            <AvatarImage src={sellerInfo?.avatarUrl || sellerAvatar} />
                            <AvatarFallback className="bg-luxury/10 text-luxury font-bold">
                                {getInitials(sellerInfo?.name || sellerName)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-lg leading-none">
                                    {sellerInfo?.isDealer ? sellerInfo.companyName : (sellerInfo?.name || sellerName)}
                                </h3>
                                {sellerInfo?.verificationStatus === 'verified' && (
                                    <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-50" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    {sellerInfo?.isDealer ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                    {sellerInfo?.isDealer ? 'Dealer' : 'Private Seller'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amber-500 font-medium">
                                    <Star className="h-3 w-3 fill-current" />
                                    {sellerInfo?.rating || 'New'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background/50 rounded-lg p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 bg-green-100 text-green-700 rounded-full">
                            <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Location</p>
                            <p className="font-medium leading-tight">Dubai, UAE</p>
                        </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-full">
                            <Shield className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Verified</p>
                            <p className="font-medium leading-tight">Identity</p>
                        </div>
                    </div>
                </div>
            </div>

            <CardContent className="p-5 pt-0 space-y-3">
                {/* Primary Action - Contact */}
                <div className="space-y-2">
                    {!showContactOptions ? (
                        <Button
                            size="lg"
                            className="w-full bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20 text-base h-12"
                            onClick={handleContactClick}
                        >
                            <Phone className="h-4 w-4 mr-2" />
                            {t('cars.contactSeller')}
                        </Button>
                    ) : (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Button
                                variant="outline"
                                className="w-full justify-between h-12 border-luxury/20 hover:bg-luxury/5 hover:border-luxury/40 group"
                                onClick={handleCall}
                            >
                                <span className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-luxury" />
                                    Call Now
                                </span>
                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full group-hover:bg-white transition-colors">
                                    {phoneNumber}
                                </span>
                            </Button>

                            {(whatsappNumber || phoneNumber) && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-12 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700"
                                    onClick={handleWhatsApp}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    WhatsApp
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground hover:text-foreground h-8"
                                onClick={() => setShowContactOptions(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        variant="outline"
                        className={`w-full border-luxury/10 hover:bg-luxury/5 ${isFavorite ? 'text-red-500 border-red-100 bg-red-50 hover:bg-red-100' : ''}`}
                        onClick={onToggleFavorite}
                    >
                        <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                        {isFavorite ? 'Saved' : 'Save'}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full border-luxury/10 hover:bg-luxury/5"
                        onClick={handleShare}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                </div>

                {/* Admin Actions */}
                {isAdmin && isSold && (
                    <div className="pt-2 border-t border-border/40">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={onUnmarkSold}
                        >
                            Unmark Sold (Admin)
                        </Button>
                    </div>
                )}

                {/* Safety Tip */}
                <div className="bg-blue-50/50 rounded-lg p-3 text-xs text-blue-600/80 flex gap-2 items-start mt-2">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>Never send money without inspecting the car first.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default SellerActionCard;
