import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, Edit, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatCity, formatSpec } from '@/utils/formatters';

interface DashboardCarCardProps {
  id: string;
  title: string;
  price: string | number;
  year?: string;
  mileage?: string;
  spec?: string;
  location?: string;
  image?: string;
  status?: 'published' | 'draft' | 'sold';
  dateAdded?: string;
  views?: number;
  isFavorite?: boolean;
  onRemoveFavorite?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  variant?: 'listing' | 'favorite';
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

const DashboardCarCard = ({
  id,
  title,
  price,
  year,
  mileage,
  spec,
  location,
  image,
  status = 'published',
  dateAdded,
  views = 0,
  onRemoveFavorite,
  onEdit,
  onDelete,
  showActions = false,
  variant = 'listing',
  moderationStatus
}: DashboardCarCardProps) => {
  const [deleting, setDeleting] = useState(false);

  const formatPrice = (price: string | number) => {
    // Normalize to string
    const raw = typeof price === 'number' ? String(price) : (price ?? '');

    // Add spaces to price for better readability and ensure AED prefix
    const numericPrice = raw.replace(/[^\d]/g, '');
    if (!numericPrice) return typeof price === 'undefined' || price === null ? 'Price not set' : String(price);
    const formattedNumber = numericPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return raw.toLowerCase().includes('aed') ? raw : `AED ${formattedNumber}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sold':
        return <Badge variant="destructive">Sold</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="group overflow-hidden hover-lift glass-effect border-luxury/10 animate-fade-in-up">
      <div className="relative overflow-hidden">
        <img 
          src={image || '/placeholder-car.jpg'} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status and Moderation Badges */}
        <div className="absolute top-3 left-3 space-y-2">
          {getStatusBadge()}
          {moderationStatus === 'pending' && (
            <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-black">Pending review</Badge>
          )}
          {moderationStatus === 'rejected' && (
            <Badge variant="destructive">Rejected</Badge>
          )}
        </div>

        {/* Favorite Button for Favorites variant - hidden by default, shown on hover */}
        {variant === 'favorite' && (
          <div className="absolute top-3 right-3 opacity-0 md:group-hover:opacity-100 car-card-actions car-card-actions-desktop transform translate-y-2 md:group-hover:translate-y-0 pointer-events-none md:group-hover:pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              className="glass-effect hover:bg-destructive/20 text-destructive hover:text-destructive transition-all duration-300 hover:scale-110 pointer-events-auto"
              onClick={() => onRemoveFavorite?.(id)}
            >
              <Heart className="h-4 w-4 fill-current" />
            </Button>
          </div>
        )}

        {/* Mobile-only: Touch overlay for favorites */}
        {variant === 'favorite' && (
          <div className="md:hidden absolute inset-0 z-20 opacity-0 active:opacity-100 transition-opacity duration-200 bg-black/10 flex items-start justify-end p-3 pointer-events-auto car-card-mobile-overlay">
            <Button
              variant="ghost"
              size="sm"
              className="glass-effect bg-background/90 hover:bg-destructive/20 text-destructive hover:text-destructive transition-all duration-300 hover:scale-110 pointer-events-auto"
              onClick={() => onRemoveFavorite?.(id)}
            >
              <Heart className="h-4 w-4 fill-current" />
            </Button>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
          <div className="flex gap-2">
            <Link to={`/car/${id}`} className="flex-1">
              <Button variant="luxury" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </Link>
            {showActions && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(id)}
                  className="glass-effect"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-effect hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will remove the listing from your profile. You can contact support to restore within 7 days.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (!onDelete) return;
                          try {
                            setDeleting(true);
                            await onDelete(id);
                          } finally {
                            setDeleting(false);
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</span>
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-luxury transition-colors">
              {title}
            </h3>
            {location && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{formatCity(location)}</span>
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {year && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {year}
              </div>
            )}
            {mileage && (
              <div>
                {mileage} km
              </div>
            )}
            {spec && (
              <div>
                {formatSpec(spec)}
              </div>
            )}
          </div>

          {/* Price and Meta Info */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="text-2xl font-bold gradient-text">
              {formatPrice(price)}
            </div>
            <div className="text-right">
              {variant === 'listing' && (
                <>
                  {dateAdded && (
                    <div className="text-xs text-muted-foreground">
                      Added {new Date(dateAdded).toLocaleDateString()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {views} views
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCarCard;
