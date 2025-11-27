import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormProgressProps {
  requiredFields: string[];
  formData: Record<string, any>;
  className?: string;
}

export const FormProgress = ({ requiredFields, formData, className }: FormProgressProps) => {
  // More robust validation function
  const isFieldFilled = (field: string) => {
    const value = formData[field];
    if (value === null || value === undefined) return false;
    const stringValue = String(value).trim();
    return stringValue.length > 0;
  };

  const filledCount = requiredFields.filter(isFieldFilled).length;
  const totalCount = requiredFields.length;
  const percentage = (filledCount / totalCount) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="text-foreground font-medium">{filledCount} of {totalCount} required</span>
      </div>
      
      <div className="relative w-full bg-muted rounded-full h-2">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-luxury to-luxury/80 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        {percentage === 100 ? (
          <div className="flex items-center gap-2 text-luxury">
            <Check className="w-4 h-4" />
            <span className="font-medium">Ready to publish</span>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-muted-foreground">
              {totalCount - filledCount} more field{totalCount - filledCount === 1 ? '' : 's'} required
            </span>
            {/* Debug: Show field status */}
            <div className="text-xs space-y-1">
              {requiredFields.map(field => {
                const isFilled = isFieldFilled(field);
                const value = formData[field];
                const displayValue = value === null || value === undefined ? 'null/undefined' : String(value);
                return (
                  <div key={field} className={`flex items-center gap-2 ${isFilled ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${isFilled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{field}: {isFilled ? '✓' : '✗'} ({displayValue})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};