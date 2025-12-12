import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RotateCcw,
  Share2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface InspectionToolbarProps {
  currentReportId?: string;
  onReportIdChange: (id: string | undefined) => void;
  onReset: () => void;
  onShare: () => void;
  saving: boolean;
  loading: boolean;
  readOnly: boolean;
  onLoadReport?: (id: string | undefined) => void;
  forceReadOnly: boolean;
}

export const InspectionToolbar: React.FC<InspectionToolbarProps> = ({
  currentReportId,
  onReportIdChange,
  onReset,
  onShare,
  saving,
  loading,
  readOnly,
  onLoadReport,
  forceReadOnly,
}) => {
  // Don't render toolbar in read-only mode
  if (forceReadOnly) return null;

  return (
    <div className="bg-background border-b border-border/80 print:hidden">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Link to="/reports" className="flex-shrink-0">
              <Button size="sm" variant="outline" className="gap-2 w-full">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-destructive"
              onClick={onReset}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </Button>
            <div className="h-4 w-px bg-border/50 mx-2 hidden sm:block" />

            {/* Report ID Display */}
            {currentReportId ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-border/60">
                <span className="text-xs text-muted-foreground">ID:</span>
                <code className="text-xs font-mono text-foreground">{currentReportId.slice(0, 8)}...</code>
              </div>
            ) : (
              <Input
                placeholder="Enter report ID..."
                value=""
                onChange={(e) => onReportIdChange(e.target.value || undefined)}
                className="h-9 sm:h-8 w-full sm:w-36 bg-background text-base sm:text-sm rounded-md"
              />
            )}
          </div>

          <div className="flex w-full sm:w-auto gap-2 items-center">
            {!currentReportId && onLoadReport && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onLoadReport(currentReportId)}
                disabled={loading || !currentReportId}
                className="flex-1 sm:flex-none"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
              </Button>
            )}

            <div className="h-4 w-px bg-border/50 mx-2 hidden sm:block" />

            <Button size="sm" variant="outline" onClick={onShare} className="gap-2 flex-1 sm:flex-none">
              <Share2 className="w-4 h-4" />
              <span className="sm:inline">Share</span>
            </Button>

            {/* Save Status Badge */}
            {saving && (
              <Badge variant="outline" className="gap-2 bg-blue-50 text-blue-700 border-blue-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
