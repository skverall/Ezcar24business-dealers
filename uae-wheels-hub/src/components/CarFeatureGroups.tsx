import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Smartphone, Car, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CarFeatureGroupsProps {
  className?: string;
  features?: string[]; // Real features/tags from DB
}

const CarFeatureGroups: React.FC<CarFeatureGroupsProps> = ({ className, features }) => {
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();

  const norm = (s: string) => s.trim();
  const list = (features || []).map(norm).filter(Boolean);

  // Map incoming tags/features into grouped categories
  const safety = list.filter(f => /abs|airbag|esc|traction|sensor|backup|camera|brake/i.test(f));
  const tech = list.filter(f => /bluetooth|usb|carplay|android|nav|gps|climate|cruise|keyless|remote|start/i.test(f));
  const style = list.filter(f => /alloy|leather|sunroof|panoramic|led|sport|spoiler|premium/i.test(f));

  const featureGroups = [
    safety.length > 0 && {
      title: t('carFeatures.safety'),
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      features: safety
    },
    tech.length > 0 && {
      title: t('carFeatures.tech'),
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      features: tech
    },
    style.length > 0 && {
      title: t('carFeatures.style'),
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      features: style
    }
  ].filter(Boolean) as Array<{
    title: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
    features: string[];
  }>;

  if (featureGroups.length === 0) return null;

  const visibleGroups = showAll ? featureGroups : featureGroups.slice(0, 2);

  return (
    <Card className={`glass-effect border-luxury/10 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <Car className="h-5 w-5 text-luxury" />
          {t('carFeatures.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleGroups.map((group, index) => {
            const Icon = group.icon;
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${group.bgColor} border ${group.borderColor}`}>
                    <Icon className={`h-4 w-4 ${group.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{group.title}</h3>
                </div>
                <div className="space-y-2">
                  {group.features.slice(0, 4).map((feature, featureIndex) => (
                    <Badge
                      key={featureIndex}
                      variant="outline"
                      className="text-xs px-2 py-1 bg-background/50 hover:bg-luxury/5 transition-colors duration-200"
                    >
                      {feature}
                    </Badge>
                  ))}
                  {group.features.length > 4 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-muted/50">
                      +{group.features.length - 4} {t('carFeatures.more')}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {featureGroups.length > 2 && (
          <div className="flex justify-center pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-luxury hover:text-luxury/80 hover:bg-luxury/5"
            >
              {showAll ? (
                <>
                  {t('carFeatures.showLess')} <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  {t('carFeatures.showAll')} <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarFeatureGroups;
