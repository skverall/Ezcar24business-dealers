import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SpecFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon: LucideIcon;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
}

export const SpecField = React.memo<SpecFieldProps>(
  ({ label, value, onChange, icon: Icon, placeholder, type = 'text', readOnly, className }) => {
    const isDateType = type === 'date';

    return (
      <div
        className={cn(
          'group relative bg-card hover:bg-accent/50 transition-all duration-200 rounded-xl p-3 border border-border/40 hover:border-border/80 h-full flex flex-col justify-center shadow-sm hover:shadow-md',
          className
        )}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/70 mb-1.5 group-hover:text-luxury transition-colors">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={readOnly}
          className={cn(
            'text-sm font-bold !text-gray-900 placeholder:text-muted-foreground/30 focus-visible:ring-0 disabled:!text-gray-900 disabled:!opacity-100',
            isDateType
              ? 'h-8 px-2 border border-border/50 rounded-md bg-background/50 cursor-pointer'
              : 'h-7 p-0 border-none bg-transparent'
          )}
        />
      </div>
    );
  }
);

SpecField.displayName = 'SpecField';
