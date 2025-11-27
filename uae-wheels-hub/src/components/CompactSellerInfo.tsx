import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, User, Award, Calendar, Building2, Car, MessageSquare, MapPin, Shield, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CompactSellerInfoProps {
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  memberSince?: string;
  isVerified?: boolean;
  className?: string;
}

const CompactSellerInfo: React.FC<CompactSellerInfoProps> = ({
  sellerId,
  sellerName,
  sellerAvatar,
  rating,
  reviewCount,
  salesCount,
  memberSince,
  isVerified,
  className
}) => {
  const [sellerInfo, setSellerInfo] = useState<{
    name: string;
    isDealer: boolean;
    companyName?: string;
    avatarUrl?: string;
    createdAt?: string;
    verificationStatus?: string;
    totalListings?: number;
    activeListings?: number;
    totalViews?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load seller information
  useEffect(() => {
    const loadSellerInfo = async () => {
      if (!sellerId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, is_dealer, company_name, avatar_url, created_at, verification_status')
          .eq('user_id', sellerId)
          .single();

      // Proxy avatar URL if present
      if (data?.avatar_url) {
        (data as any).avatar_url = getProxiedImageUrl(data.avatar_url);
      }

        if (error) {
          console.error('Error loading seller info:', error);
          return;
        }

        const row = data as any;
        setSellerInfo({
          name: row.full_name || 'Unknown User',
          isDealer: !!row.is_dealer,
          companyName: row.company_name,
          avatarUrl: row.avatar_url ? getProxiedImageUrl(row.avatar_url) : undefined,
          createdAt: row.created_at,
          verificationStatus: row.verification_status
        });
      } catch (err) {
        console.error('Error loading seller info:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSellerInfo();
  }, [sellerId]);

  const getInitials = (name: string | undefined | null) => {
    if (!name || name.trim() === '') return 'U';

    return name
      .trim()
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`glass-effect border-luxury/10 relative ${className}`}>
      {/* Verified Badge - Top Right Corner */}
      {(sellerInfo?.verificationStatus === 'verified' || isVerified) && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs shadow-sm">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </Badge>
        </div>
      )}

      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-luxury/20 flex-shrink-0">
            <AvatarImage src={getProxiedImageUrl(sellerInfo?.avatarUrl || sellerAvatar || '')} alt={sellerInfo?.name || sellerName} />
            <AvatarFallback className="bg-luxury/10 text-luxury font-semibold text-sm sm:text-lg">
              {getInitials(sellerInfo?.name || sellerName)}
            </AvatarFallback>
          </Avatar>

          {/* Seller Info */}
          <div className="flex-1 min-w-0 pr-16"> {/* Add right padding for verified badge */}
            {/* Seller Name */}
            <div className="mb-3">
              <h3 className="font-bold text-base sm:text-lg text-foreground leading-tight break-words">
                {sellerInfo?.isDealer && sellerInfo?.companyName
                  ? sellerInfo.companyName
                  : sellerInfo?.name || sellerName || 'Unknown Seller'}
              </h3>
            </div>

            {/* Seller Type and Information Blocks */}
            <div className="space-y-3">
              {/* Seller Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-background/50 border-border/50 flex-shrink-0">
                  {sellerInfo?.isDealer ? (
                    <>
                      <Building2 className="h-3 w-3 mr-1 text-blue-600" />
                      Dealer
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1 text-gray-600" />
                      Individual
                    </>
                  )}
                </Badge>
              </div>

              {/* Information Grid - Different for Individual vs Dealer */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {sellerInfo?.isDealer ? (
                  // Dealer Information Blocks
                  <>
                    {/* Cars Sold */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <Award className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Cars Sold</div>
                        <div className="font-medium text-xs">{salesCount || '0'}</div>
                      </div>
                    </div>

                    {/* Customer Rating */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Rating</div>
                        <div className="font-medium text-xs">{rating ? `${rating} (${reviewCount})` : 'New'}</div>
                      </div>
                    </div>

                    {/* Specialization */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <Target className="h-3 w-3 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Specialization</div>
                        <div className="font-medium text-xs">Premium Cars</div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Location</div>
                        <div className="font-medium text-xs">Dubai, UAE</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Status</div>
                        <div className="font-medium text-xs">Active</div>
                      </div>
                    </div>

                    {/* Active Listings */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <Car className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Active</div>
                        <div className="font-medium text-xs">{sellerInfo?.activeListings || '0'}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Individual Seller Information Blocks
                  <>
                    {/* Seller Rating */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Rating</div>
                        <div className="font-medium text-xs">{rating ? `${rating} (${reviewCount})` : 'New'}</div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md">
                      <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Location</div>
                        <div className="font-medium text-xs">Dubai, UAE</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md col-span-2">
                      <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-xs">Status</div>
                        <div className="font-medium text-xs">Active Seller</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Response Time - Bottom section */}
            <div className="mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-muted-foreground">Usually responds within</span>
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  ~2 hours
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactSellerInfo;
