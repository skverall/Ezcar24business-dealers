import React from 'react';
import { ListChecks } from 'lucide-react';

interface RecommendationsSectionProps {
  recommendations: string;
  onChange: (text: string) => void;
  readOnly?: boolean;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations,
  onChange,
  readOnly,
}) => {
  return (
    <div className="md:col-span-12 print-col-12 print-break-inside-avoid">
      <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50 card-print-clean">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <ListChecks className="w-4 h-4 text-luxury" />
          Recommended Actions
        </h3>

        {readOnly ? (
          <div className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-card text-base font-medium text-foreground leading-relaxed whitespace-pre-wrap shadow-sm">
            {recommendations || (
              <span className="text-muted-foreground italic font-normal">
                No recommendations added.
              </span>
            )}
          </div>
        ) : (
          <textarea
            value={recommendations || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="List recommended repairs, services, or next steps..."
            className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-luxury/20 focus:border-luxury resize-y text-sm leading-relaxed"
          />
        )}
      </div>
    </div>
  );
};

