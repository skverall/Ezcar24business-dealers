import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RotateCcw,
  Share2,
  Save,
  Loader2,
  FileText,
  Check,
  Car,
  CheckCircle2,
  MessageCircle,
  Wrench,
} from 'lucide-react';
import { type LinkedListing } from '../types/inspection.types';

interface InspectionActionsProps {
  // Toolbar props
  currentReportId?: string;
  onReportIdChange: (id: string | undefined) => void;
  onReset: () => void;
  onShare: () => void;
  onSave: () => void;
  saving: boolean;
  loading: boolean;
  readOnly: boolean;
  onLoadReport?: (id: string | undefined) => void;

  // Publish & Share props
  forceReadOnly: boolean;
  reportStatus: 'draft' | 'frozen';
  shareSlug: string | null;
  linkedListing: LinkedListing | null;
  selectedListingId: string | null;
  availableListings: Array<{ id: string; title: string; make: string; model: string; year: number; vin?: string }>;
  onListingChange: (listingId: string) => void;
  onGenerateReport: () => void;
  onUnfreezeReport: () => void;
  isGenerating: boolean;
  isAdmin: boolean;
  carInfo: {
    brand: string;
    model: string;
  };
  onToast: (data: { title: string; description: string }) => void;
}

export const InspectionActions: React.FC<InspectionActionsProps> = ({
  currentReportId,
  onReportIdChange,
  onReset,
  onShare,
  onSave,
  saving,
  loading,
  readOnly,
  onLoadReport,
  forceReadOnly,
  reportStatus,
  shareSlug,
  linkedListing,
  selectedListingId,
  availableListings,
  onListingChange,
  onGenerateReport,
  onUnfreezeReport,
  isGenerating,
  isAdmin,
  carInfo,
  onToast,
}) => {
  return (
    <>
      {/* Top Toolbar - Only show if NOT forceReadOnly */}
      {!forceReadOnly && (
        <div className="bg-card/50 backdrop-blur-md border-b border-border/50 print:hidden">
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border/50">
                    <span className="text-xs text-muted-foreground">ID:</span>
                    <code className="text-xs font-mono text-foreground">{currentReportId.slice(0, 8)}...</code>
                  </div>
                ) : (
                  <Input
                    placeholder="Enter report ID..."
                    value=""
                    onChange={(e) => onReportIdChange(e.target.value || undefined)}
                    className="h-9 sm:h-8 w-full sm:w-36 bg-background/50 text-base sm:text-sm"
                  />
                )}
              </div>

              <div className="flex w-full sm:w-auto gap-2">
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
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving || readOnly}
                  className="gap-2 bg-luxury hover:bg-luxury/90 text-white flex-1 sm:flex-none"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish & Share Section - Only show if NOT forceReadOnly */}
      {!forceReadOnly && (
        <div className="md:col-span-12 order-last print:hidden">
          <div className="bg-gradient-to-br from-luxury/5 via-background to-luxury/5 rounded-3xl p-6 border border-luxury/20 shadow-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-luxury" />
              Publish & Share
              {reportStatus === 'frozen' && (
                <Badge className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Published
                </Badge>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Link to Listing */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Link to Vehicle Listing
                </Label>
                {linkedListing ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <Car className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {linkedListing.make} {linkedListing.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{linkedListing.year}</p>
                    </div>
                    <Link to={`/car/${linkedListing.id}`} className="text-xs text-luxury hover:underline">
                      View Listing →
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedListingId || 'none'}
                    onChange={(e) => onListingChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full h-11 px-3 rounded-xl bg-background/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-luxury/50 focus:border-luxury/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="none">No vehicle linked</option>
                    {availableListings
                      .filter((l) => l.make || l.model || l.title)
                      .map((listing) => {
                        const label =
                          [listing.make, listing.model, listing.year].filter(Boolean).join(' ') ||
                          listing.title ||
                          'Untitled Vehicle';
                        return (
                          <option key={listing.id} value={listing.id}>
                            {label}
                          </option>
                        );
                      })}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">
                  Link this report to a vehicle listing. Customers will see "View Inspection Report" on the listing page.
                </p>
              </div>

              {/* Share Link */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Shareable Link
                </Label>
                {shareSlug ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/report/${shareSlug}`}
                        className="h-11 rounded-xl bg-background/50 text-sm font-mono"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11 rounded-xl shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/report/${shareSlug}`);
                          onToast({ title: 'Copied!', description: 'Link copied to clipboard.' });
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-11 w-11 rounded-xl shrink-0 bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
                        onClick={() => {
                          const text = `Check out the inspection report for this ${carInfo.brand} ${carInfo.model}: ${window.location.origin}/report/${shareSlug}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                      >
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Report is published and viewable by anyone with the link
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      Generate the report to get a shareable link
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-border/50">
              {reportStatus === 'draft' ? (
                <Button
                  onClick={onGenerateReport}
                  disabled={isGenerating || readOnly}
                  className="gap-2 bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate Report
                </Button>
              ) : (
                <>
                  <Badge variant="outline" className="gap-1 py-1.5 px-3 text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                    <Check className="w-3 h-3" />
                    Report Published
                  </Badge>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={onUnfreezeReport}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <Wrench className="w-4 h-4" />
                      Unlock for Editing
                    </Button>
                  )}
                </>
              )}

              {!currentReportId && (
                <p className="text-xs text-muted-foreground">Save the report first before generating</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
