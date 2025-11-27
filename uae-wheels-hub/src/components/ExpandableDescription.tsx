import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableDescription({ 
  description, 
  maxLength = 300, 
  className = "" 
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description) return null;
  
  const shouldTruncate = description.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? description.substring(0, maxLength) + '...'
    : description;
  
  // Convert line breaks to JSX
  const formatText = (text: string) => {
    return text.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className={className}>
      <div className="text-foreground leading-relaxed text-base whitespace-pre-wrap">
        {formatText(displayText)}
      </div>
      
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 p-0 h-auto text-luxury hover:text-luxury/80 font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Read Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Read More
            </>
          )}
        </Button>
      )}
    </div>
  );
}
