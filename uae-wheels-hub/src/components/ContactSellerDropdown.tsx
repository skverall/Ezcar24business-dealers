import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MessageSquare, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { trackCarContact } from '@/components/GoogleAnalytics';
import { useTranslation } from 'react-i18next';

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

interface ContactSellerDropdownProps {
  phoneNumber?: string;
  whatsappNumber?: string;
  listingId?: string;
  sellerId?: string;
  onCallClick: () => void;
  className?: string;
}

const ContactSellerDropdown: React.FC<ContactSellerDropdownProps> = ({
  phoneNumber = '+971 50 123 4567',
  whatsappNumber,
  listingId,
  sellerId,
  onCallClick,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMessageClick = () => {
    if (!user) {
      navigate(`${pathPrefix}/auth?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (listingId && sellerId) {
      // Track message contact
      trackCarContact(listingId, 'chat');

      const targetUrl = `${pathPrefix}/messages?listingId=${listingId}&sellerId=${sellerId}`;
      navigate(targetUrl);
    }
    setIsExpanded(false);
  };

  const handleCallClick = () => {
    onCallClick();
    setIsExpanded(false);
  };

  const handleWhatsAppClick = () => {
    if (!user) {
      navigate(`${pathPrefix}/auth?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (listingId) {
      // Track WhatsApp contact
      trackCarContact(listingId, 'whatsapp');
    }

    // Format WhatsApp number for URL (remove spaces and special characters)
    const cleanNumber = (whatsappNumber || phoneNumber).replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // Create WhatsApp URL with pre-filled message
    const message = encodeURIComponent(`Hi! I'm interested in your car listing on EzCar24.`);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    setIsExpanded(false);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Main Contact Button */}
      <Button
        size="lg"
        className={cn(
          "bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full",
          isExpanded && "rounded-b-none shadow-none"
        )}
        onClick={toggleExpanded}
      >
        <Phone className="h-5 w-5 mr-2" />
        {t('cars.contactSeller')}
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 ml-2 transition-transform duration-300" />
        ) : (
          <ChevronDown className="h-5 w-5 ml-2 transition-transform duration-300" />
        )}
      </Button>

      {/* Animated Dropdown */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isExpanded ? "opacity-100" : "opacity-0"
        )}
        style={{ height: `${height}px` }}
      >
        <div ref={contentRef} className="pt-0">
          <Card className="glass-effect border-luxury/20 shadow-xl backdrop-blur-md rounded-t-none border-t-0">
            <CardContent className="p-4 sm:p-6">
              {/* Close Button */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('contact.chooseMethod')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 hover:bg-luxury/10 rounded-full transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Contact Options */}
              <div className="space-y-3 sm:space-y-4">
                {/* Message Option */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 sm:h-16 hover:bg-luxury/5 hover:border-luxury/30 transition-all duration-300 group border-2 hover:shadow-md"
                  onClick={handleMessageClick}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                    <div className="p-2 sm:p-3 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300 border border-blue-200">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-foreground text-sm sm:text-base">{t('contact.sendMessage')}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{t('contact.chatHint')}</div>
                    </div>
                  </div>
                </Button>

                {/* WhatsApp Option - Show if WhatsApp number is available */}
                {(whatsappNumber || phoneNumber) && (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-14 sm:h-16 hover:bg-luxury/5 hover:border-luxury/30 transition-all duration-300 group border-2 hover:shadow-md"
                    onClick={handleWhatsAppClick}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                      <div className="p-2 sm:p-3 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors duration-300 border border-green-200">
                        <WhatsAppIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground text-sm sm:text-base">{t('contact.whatsapp')}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {t('contact.whatsappHint')}
                        </div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Call Option */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 sm:h-16 hover:bg-luxury/5 hover:border-luxury/30 transition-all duration-300 group border-2 hover:shadow-md"
                  onClick={handleCallClick}
                  asChild
                >
                  <a href={`tel:${phoneNumber}`}>
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                      <div className="p-2 sm:p-3 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300 border border-blue-200">
                        <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground text-sm sm:text-base">{t('contact.callNow')}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{phoneNumber}</div>
                      </div>
                    </div>
                  </a>
                </Button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/30">
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p>{t('contact.responseTime')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactSellerDropdown;
