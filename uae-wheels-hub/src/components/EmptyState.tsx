import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'luxury' | 'outline' | 'ghost';
  };
  className?: string;
}

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionButton, 
  className = '' 
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-16 px-6 ${className}`}>
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center text-4xl text-muted-foreground/60 animate-fade-in-up">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-4 text-foreground animate-fade-in-up [animation-delay:0.1s]">
        {title}
      </h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed animate-fade-in-up [animation-delay:0.2s]">
        {description}
      </p>
      {actionButton && (
        <div className="flex justify-center animate-fade-in-up [animation-delay:0.3s]">
          {actionButton.href ? (
            <Link to={actionButton.href}>
              <Button
                variant={actionButton.variant || 'luxury'}
                className="hover-lift px-8 py-3"
                size="lg"
              >
                {actionButton.text}
              </Button>
            </Link>
          ) : (
            <Button
              variant={actionButton.variant || 'luxury'}
              onClick={actionButton.onClick}
              className="hover-lift px-8 py-3"
              size="lg"
            >
              {actionButton.text}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
