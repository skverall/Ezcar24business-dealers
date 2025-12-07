import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gauge, Fuel, Cog, MapPin } from "lucide-react";
import { formatSpec, formatCity } from "@/utils/formatters";

interface ListingPreviewCardProps {
    title: string;
    price: string;
    year: number;
    mileage: string;
    fuelType: string;
    spec: string;
    image: string;
    location: string;
}

const ListingPreviewCard = ({
    title,
    price,
    year,
    mileage,
    fuelType,
    spec,
    image,
    location,
}: ListingPreviewCardProps) => {
    return (
        <Card className="group overflow-hidden border-luxury/20 shadow-lg bg-card h-full flex flex-col">
            {/* Image Zone */}
            <div className="relative overflow-hidden aspect-[4/3] flex-shrink-0">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                <div className="absolute top-4 left-4">
                    <Badge className="bg-luxury text-white border-none shadow-md">
                        Preview
                    </Badge>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-bold text-lg leading-tight shadow-black/50 drop-shadow-md line-clamp-2">
                        {title}
                    </h3>
                </div>
            </div>

            {/* Content Zone */}
            <CardContent className="p-5 flex-1 flex flex-col space-y-4">
                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-luxury" />
                        <span className="font-medium text-foreground">{year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <Gauge className="h-4 w-4 text-luxury" />
                        <span className="font-medium text-foreground">{mileage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <Fuel className="h-4 w-4 text-luxury" />
                        <span className="font-medium text-foreground capitalize">{fuelType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <Cog className="h-4 w-4 text-luxury" />
                        <span className="font-medium text-foreground">{formatSpec(spec)}</span>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-luxury/70" />
                    <span>{formatCity(location)}</span>
                </div>

                {/* Price */}
                <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Price</p>
                        <p className="text-2xl font-bold text-luxury">{price}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ListingPreviewCard;
