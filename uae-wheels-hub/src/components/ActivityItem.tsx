import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Heart, 
  DollarSign, 
  Camera, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityItemProps {
  id: string;
  type: string;
  title?: string;
  description?: string;
  timestamp: string;
  listingId?: string;
  listingTitle?: string;
  payload?: any;
}

const ActivityItem = ({
  id,
  type,
  title,
  description,
  timestamp,
  listingId,
  listingTitle,
  payload
}: ActivityItemProps) => {
  const getActivityIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'listing_created':
      case 'car_listed':
        return <Plus className="h-5 w-5 text-green-500" />;
      case 'listing_updated':
      case 'car_updated':
        return <Edit className="h-5 w-5 text-blue-500" />;
      case 'listing_deleted':
      case 'car_deleted':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'listing_viewed':
      case 'car_viewed':
        return <Eye className="h-5 w-5 text-purple-500" />;
      case 'listing_favorited':
      case 'car_favorited':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'price_updated':
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case 'photos_updated':
        return <Camera className="h-5 w-5 text-indigo-500" />;
      case 'listing_sold':
      case 'car_sold':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityTitle = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'listing_created':
      case 'car_listed':
        return 'Listed a new car';
      case 'listing_updated':
      case 'car_updated':
        return 'Updated car listing';
      case 'listing_deleted':
      case 'car_deleted':
        return 'Deleted car listing';
      case 'listing_viewed':
      case 'car_viewed':
        return 'Car listing viewed';
      case 'listing_favorited':
      case 'car_favorited':
        return 'Car added to favorites';
      case 'price_updated':
        return 'Updated car price';
      case 'photos_updated':
        return 'Updated car photos';
      case 'listing_sold':
      case 'car_sold':
        return 'Car marked as sold';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getActivityDescription = () => {
    if (description) return description;
    if (listingTitle) return listingTitle;
    if (payload?.title) return payload.title;
    return 'Activity details';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityBadge = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'listing_created':
      case 'car_listed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">New</Badge>;
      case 'listing_updated':
      case 'car_updated':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Updated</Badge>;
      case 'listing_sold':
      case 'car_sold':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Sold</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Activity Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            {getActivityIcon(type)}
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">
                    {title || getActivityTitle(type)}
                  </h4>
                  {getActivityBadge(type)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {getActivityDescription()}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(timestamp)}
                  </span>
                  {listingId && (
                    <Link to={`/car/${listingId}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-luxury hover:text-luxury/80"
                      >
                        View listing
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityItem;
