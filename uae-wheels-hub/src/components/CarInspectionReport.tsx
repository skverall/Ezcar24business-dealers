import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  ensureAuthorForUser,
  getReportWithDetails,
  hasAdminRole,
  isWhitelistedReportAuthor,
  logReportAction,
  saveReport,
  uploadReportPhoto,
  freezeReport,
  unfreezeReport,
  linkReportToListing,
  getAvailableListingsForReport,
  type ReportBodyPartInput,
  type ReportStatus,
} from '@/services/reportsService';
import {
  Printer,
  Check,
  AlertTriangle,
  X,
  Camera,
  Car,
  Calendar,
  Gauge,
  FileText,
  Info,
  Wrench,
  Cog,
  Disc,
  Save,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Upload,
  Armchair,
  Sparkles,
  Copy,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MechanicalChecklistModal, { MechanicalStatus, MechanicalCategory, DEFAULT_CHECKLISTS } from './MechanicalChecklistModal';
import InteriorChecklist, { InteriorStatus, DEFAULT_INTERIOR_STATUS } from './InteriorChecklist';

export type TireCondition = 'good' | 'fair' | 'poor' | 'replace';

export type TireDetails = {
  brand: string;
  size: string;
  dot: string; // Week/Year
  treadDepth: string;
  condition: TireCondition;
};

export type TiresStatus = {
  frontLeft: TireDetails;
  frontRight: TireDetails;
  rearLeft: TireDetails;
  rearRight: TireDetails;
  spare: TireDetails;
};

export const DEFAULT_TIRE_DETAILS: TireDetails = {
  brand: '',
  size: '',
  dot: '',
  treadDepth: '',
  condition: 'good',
};

export const DEFAULT_TIRES_STATUS: TiresStatus = {
  frontLeft: { ...DEFAULT_TIRE_DETAILS },
  frontRight: { ...DEFAULT_TIRE_DETAILS },
  rearLeft: { ...DEFAULT_TIRE_DETAILS },
  rearRight: { ...DEFAULT_TIRE_DETAILS },
  spare: { ...DEFAULT_TIRE_DETAILS },
};

type Props = {
  reportId?: string;
};

type BodyStatus = 'original' | 'painted' | 'replaced' | 'putty';

const bodyPartKeys: { key: string; label: string }[] = [
  { key: 'hood', label: 'Hood' },
  { key: 'roof', label: 'Roof' },
  { key: 'trunk', label: 'Trunk' },
  { key: 'frontBumper', label: 'Front bumper' },
  { key: 'rearBumper', label: 'Rear bumper' },
  { key: 'frontLeftFender', label: 'Front left fender' },
  { key: 'frontRightFender', label: 'Front right fender' },
  { key: 'rearLeftFender', label: 'Rear left fender' },
  { key: 'rearRightFender', label: 'Rear right fender' },
  { key: 'frontLeftDoor', label: 'Front left door' },
  { key: 'frontRightDoor', label: 'Front right door' },
  { key: 'rearLeftDoor', label: 'Rear left door' },
  { key: 'rearRightDoor', label: 'Rear right door' },
];

const paintColors: Record<BodyStatus, string> = {
  original: 'transparent',
  painted: '#EF4444',
  replaced: '#F59E0B',
  putty: '#F97316',
};

const statusToCondition = (status: BodyStatus): { condition: ReportBodyPartInput['condition']; severity: number } => {
  switch (status) {
    case 'original':
      return { condition: 'ok', severity: 0 };
    case 'painted':
      return { condition: 'minor_damage', severity: 1 };
    case 'putty':
      return { condition: 'major_damage', severity: 3 };
    case 'replaced':
      return { condition: 'needs_replacement', severity: 4 };
    default:
      return { condition: 'ok', severity: 0 };
  }
};

const conditionToStatus = (condition: string): BodyStatus => {
  switch (condition) {
    case 'minor_damage':
      return 'painted';
    case 'major_damage':
      return 'putty';
    case 'needs_replacement':
      return 'replaced';
    default:
      return 'original';
  }
};

const encodeSummary = (payload: any) => JSON.stringify(payload);
const decodeSummary = (summary?: string | null) => {
  if (!summary) return null;
  try {
    return JSON.parse(summary);
  } catch {
    return null;
  }
};

const StatusIndicator = ({
  label,
  status,
  issueCount = 0,
  onClick,
  icon: Icon,
  readOnly,
}: {
  label: string;
  status: 'ok' | 'issue' | 'critical' | 'na' | undefined;
  issueCount?: number;
  onClick: () => void;
  icon: any;
  readOnly?: boolean;
}) => {
  let colorClass = 'bg-card hover:bg-accent/50 border-border/40';
  let iconColorClass = 'bg-gray-100 text-gray-500';
  let statusText = 'Not Checked';

  if (status === 'ok') {
    colorClass = 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20';
    iconColorClass = 'bg-emerald-500/10 text-emerald-600';
    statusText = 'Passed';
  }
  if (status === 'issue') {
    colorClass = 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20';
    iconColorClass = 'bg-amber-500/10 text-amber-600';
    statusText = `${issueCount} Issue${issueCount !== 1 ? 's' : ''}`;
  }
  if (status === 'critical') {
    colorClass = 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20';
    iconColorClass = 'bg-red-500/10 text-red-600';
    statusText = `${issueCount} Critical`;
  }
  if (status === 'na') {
    colorClass = 'bg-muted/30 border-border/20 opacity-70';
    statusText = 'N/A';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 w-full group text-left",
        colorClass,
        !readOnly && "hover:scale-[1.02] active:scale-[0.98]",
        readOnly && "cursor-default"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
        iconColorClass
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{label}</div>
        <div className={cn(
          "text-xs font-medium truncate",
          status === 'ok' ? "text-emerald-600" :
            status === 'issue' ? "text-amber-600" :
              status === 'critical' ? "text-red-600" :
                "text-muted-foreground"
        )}>
          {statusText}
        </div>
      </div>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
        {/* Arrow or indicator could go here */}
      </div>
    </button>
  );
};

const SpecField = React.memo(({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  type = "text",
  readOnly,
  className,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon: any;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
}) => {
  const isDateType = type === 'date';

  return (
    <div className={cn(
      "group relative bg-card hover:bg-accent/50 transition-all duration-200 rounded-xl p-3 border border-border/40 hover:border-border/80 h-full flex flex-col justify-center shadow-sm hover:shadow-md",
      className
    )}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5 group-hover:text-luxury transition-colors">
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
          "text-sm font-semibold placeholder:text-muted-foreground/30 focus-visible:ring-0",
          isDateType
            ? "h-8 px-2 border border-border/50 rounded-md bg-background/50 cursor-pointer"
            : "h-7 p-0 border-none bg-transparent"
        )}
      />
    </div>
  );
});
SpecField.displayName = 'SpecField';

const CarInspectionReport: React.FC<Props> = ({ reportId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentReportId, setCurrentReportId] = useState<string | undefined>(reportId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [authorUserId, setAuthorUserId] = useState<string | null>(null);
  const [inspectorName, setInspectorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [carInfo, setCarInfo] = useState({
    brand: '',
    model: '',
    year: '',
    mileage: '',
    vin: '',
    location: '',
    date: new Date().toISOString().slice(0, 10),
    owners: '',
    mulkiaExpiry: '',
  });

  const [overallCondition, setOverallCondition] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'salvage'>('fair');
  const [comment, setComment] = useState('');

  const [bodyParts, setBodyParts] = useState<Record<string, BodyStatus>>(
    bodyPartKeys.reduce(
      (acc, part) => ({
        ...acc,
        [part.key]: 'original' as BodyStatus,
      }),
      {} as Record<string, BodyStatus>
    )
  );

  const [mechanicalStatus, setMechanicalStatus] = useState<MechanicalStatus>({});
  const [tiresStatus, setTiresStatus] = useState<TiresStatus>(DEFAULT_TIRES_STATUS);
  const [interiorStatus, setInteriorStatus] = useState<InteriorStatus>(DEFAULT_INTERIOR_STATUS);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTire, setActiveTire] = useState<keyof TiresStatus | null>(null);
  const [isTireModalOpen, setIsTireModalOpen] = useState(false);
  const [tempTireData, setTempTireData] = useState<TireDetails>({ ...DEFAULT_TIRE_DETAILS });

  const [photos, setPhotos] = useState<
    { storage_path: string; label?: string; body_part_key?: string | null; sort_order?: number }[]
  >([]);

  // Report status and linking
  const [reportStatus, setReportStatus] = useState<ReportStatus>('draft');
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [availableListings, setAvailableListings] = useState<Array<{ id: string; title: string; make: string; model: string; year: number; vin?: string }>>([]);
  const [linkedListing, setLinkedListing] = useState<{ id: string; title: string; make: string; model: string; year: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canEdit = useMemo(() => {
    // If report is frozen, only admin can edit
    if (reportStatus === 'frozen' && !isAdmin) return false;
    if (isAdmin) return true;
    if (!user?.id) return false;
    if (!isWhitelisted) return false;
    if (!currentReportId) return true; // new report
    return authorUserId === user.id;
  }, [authorUserId, currentReportId, isAdmin, isWhitelisted, user?.id, reportStatus]);

  const handlePrint = () => {
    window.print();
  };

  const loadReport = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await getReportWithDetails(id);
      if (error) throw error;
      if (!data) throw new Error('Report not found');

      setCurrentReportId(data.id);
      setAuthorUserId(data.author?.user_id || null);
      setInspectorName(data.author?.full_name || '');
      setContactEmail(data.author?.contact_email || '');
      setContactPhone(data.author?.contact_phone || '');

      // Load report status and sharing info
      setReportStatus(data.status || 'draft');
      setShareSlug(data.share_slug || null);

      // Load linked listing if any
      if (data.listing) {
        setLinkedListing(data.listing);
        setSelectedListingId(data.listing.id);
      } else {
        setLinkedListing(null);
        setSelectedListingId(null);
      }

      setCarInfo((prev) => ({
        ...prev,
        vin: data.vin || '',
        mileage: data.odometer_km ? String(data.odometer_km) : '',
        date: data.inspection_date || prev.date,
        location: data.location || '',
      }));
      setOverallCondition((data.overall_condition as any) || 'fair');
      const decoded = decodeSummary(data.summary);
      if (decoded) {
        setCarInfo((prev) => ({
          ...prev,
          brand: decoded.carInfo?.brand || '',
          model: decoded.carInfo?.model || '',
          year: decoded.carInfo?.year || '',
          owners: decoded.carInfo?.owners || '',
          mulkiaExpiry: decoded.carInfo?.mulkiaExpiry || '',
        }));
        setComment(decoded.comment || decoded.rawComment || '');
        if (decoded.mechanicalStatus) {
          // Backward compatibility check
          const status = decoded.mechanicalStatus;
          const isOldFormat = Object.values(status).some(v => typeof v === 'string');

          if (isOldFormat) {
            // Convert old format (simple strings) to new format (objects)
            const converted: MechanicalStatus = {};
            Object.entries(status).forEach(([key, value]) => {
              converted[key] = {
                status: value === 'issue' ? 'issue' : 'ok',
                items: [], // Empty items will be populated by default in modal
              };
            });
            setMechanicalStatus(converted);
          } else {
            setMechanicalStatus(status as MechanicalStatus);
          }
        }
        if (decoded.tiresStatus) setTiresStatus(decoded.tiresStatus);
        if (decoded.interiorStatus) setInteriorStatus(decoded.interiorStatus);
      } else {
        setComment(data.summary || '');
      }

      if (data.body_parts?.length) {
        const mapped: Record<string, BodyStatus> = { ...bodyParts };
        data.body_parts.forEach((bp: any) => {
          mapped[bp.part] = conditionToStatus(bp.condition);
        });
        setBodyParts(mapped);
      }

      if (data.photos?.length) {
        setPhotos(
          data.photos.map((p: any, idx: number) => ({
            storage_path: p.storage_path,
            label: p.label || '',
            body_part_key: p.body_part_id || null,
            sort_order: p.sort_order ?? idx,
          }))
        );
      } else {
        setPhotos([]);
      }

      toast({ title: 'Report loaded', description: `ID: ${id}` });
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('id', id);
        return params;
      });
    } catch (error: any) {
      toast({
        title: 'Failed to load report',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
  }, [reportId]);

  useEffect(() => {
    const check = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsWhitelisted(false);
        return;
      }
      const [adminFlag, whitelistFlag] = await Promise.all([
        hasAdminRole(user.id),
        isWhitelistedReportAuthor(user.id),
      ]);
      setIsAdmin(!!adminFlag);
      setIsWhitelisted(!!whitelistFlag);
    };
    check();
  }, [user?.id]);

  // Load available listings for linking (once on mount)
  useEffect(() => {
    const loadListings = async () => {
      try {
        const listings = await getAvailableListingsForReport();
        setAvailableListings(listings);
      } catch (error) {
        console.error('Failed to load listings:', error);
      }
    };
    loadListings();
  }, []); // Only run once on mount

  // Handle generating/freezing the report
  const handleGenerateReport = async () => {
    if (!currentReportId) {
      toast({ title: 'Save first', description: 'Please save the report before generating.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await freezeReport(currentReportId);
      setReportStatus(result.status);
      setShareSlug(result.share_slug);

      // Link to listing if selected
      if (selectedListingId) {
        await linkReportToListing(currentReportId, selectedListingId);
      }

      toast({
        title: 'Report Generated!',
        description: `Share link: ${window.location.origin}/report/${result.share_slug}`
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate report',
        description: error.message || 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle unfreezing the report (admin only)
  const handleUnfreezeReport = async () => {
    if (!currentReportId || !isAdmin) return;

    try {
      const result = await unfreezeReport(currentReportId);
      setReportStatus(result.status);
      toast({ title: 'Report unlocked', description: 'Report is now editable.' });
    } catch (error: any) {
      toast({
        title: 'Failed to unlock report',
        description: error.message || 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  // Handle listing selection change
  const handleListingChange = async (listingId: string) => {
    setSelectedListingId(listingId === 'none' ? null : listingId);

    // If report already saved, link immediately
    if (currentReportId && listingId !== 'none') {
      try {
        await linkReportToListing(currentReportId, listingId);
        const listing = availableListings.find(l => l.id === listingId);
        if (listing) setLinkedListing(listing);
        toast({ title: 'Linked to listing', description: `${listing?.make} ${listing?.model} ${listing?.year}` });
      } catch (error: any) {
        toast({ title: 'Failed to link', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: 'Sign in required', description: 'Login to create or edit reports.', variant: 'destructive' });
      return;
    }
    if (!canEdit) {
      toast({ title: 'Read-only', description: 'You are not allowed to edit this report.', variant: 'destructive' });
      return;
    }
    if (!carInfo.vin) {
      toast({ title: 'VIN required', description: 'Please enter VIN before saving.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const authorId = await ensureAuthorForUser(user.id, {
        full_name: inspectorName || user.email || 'Inspector',
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
      });

      const summaryPayload = encodeSummary({
        carInfo: {
          brand: carInfo.brand,
          model: carInfo.model,
          year: carInfo.year,
          owners: carInfo.owners,
          mulkiaExpiry: carInfo.mulkiaExpiry,
        },
        mechanicalStatus,
        tiresStatus,
        interiorStatus,
        comment,
      });

      const bodyPartsPayload = Object.entries(bodyParts).map(([part, status]) => {
        const mapped = statusToCondition(status as BodyStatus);
        return {
          part,
          condition: mapped.condition,
          severity: mapped.severity,
          notes: null,
        };
      });

      const photosPayload = photos
        .filter((p) => p.storage_path)
        .map((p, idx) => ({
          storage_path: p.storage_path,
          label: p.label || null,
          body_part_id: null,
          sort_order: p.sort_order ?? idx,
          taken_at: new Date().toISOString(),
        }));

      const savedId = await saveReport(
        {
          id: currentReportId,
          author_id: authorId,
          vin: carInfo.vin,
          odometer_km: carInfo.mileage ? parseFloat(carInfo.mileage.replace(/,/g, '')) : null,
          inspection_date: carInfo.date,
          location: carInfo.location || null,
          overall_condition: overallCondition,
          summary: summaryPayload,
        },
        bodyPartsPayload,
        photosPayload
      );

      setCurrentReportId(savedId);
      setAuthorUserId(user.id);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('id', savedId);
        return params;
      });
      await logReportAction(currentReportId ? 'update' : 'create', savedId, { vin: carInfo.vin });

      toast({ title: 'Report saved', description: `ID: ${savedId}` });
    } catch (error: any) {
      toast({
        title: 'Failed to save report',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Report URL copied to clipboard.' });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const newPhotos = [...photos];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadReportPhoto(file);
        newPhotos.push({
          storage_path: url,
          label: 'New Photo',
          sort_order: photos.length + i,
        });
      }
      setPhotos(newPhotos);
      toast({ title: 'Photos uploaded', description: `${files.length} photo(s) added.` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openMechanicalModal = (key: string) => {
    setActiveCategory(key);
    setIsModalOpen(true);
  };

  const handleMechanicalSave = (key: string, data: MechanicalCategory) => {
    setMechanicalStatus(prev => ({
      ...prev,
      [key]: data
    }));
  };

  const handleTireClick = (tireKey: keyof TiresStatus) => {
    if (readOnly) return;
    setActiveTire(tireKey);
    setTempTireData({ ...tiresStatus[tireKey] });
    setIsTireModalOpen(true);
  };

  const handleTireSave = () => {
    if (!activeTire) return;
    setTiresStatus(prev => ({
      ...prev,
      [activeTire]: { ...tempTireData }
    }));
    setIsTireModalOpen(false);
  };

  const handleSetAllGood = () => {
    if (readOnly) return;
    setTiresStatus(prev => {
      const next = { ...prev };
      (Object.keys(next) as Array<keyof TiresStatus>).forEach(key => {
        next[key] = { ...next[key], condition: 'good' };
      });
      return next;
    });
    toast({ title: "All tires set to Good", description: "All tire conditions updated." });
  };

  const handleClearAllTires = () => {
    if (readOnly) return;
    setTiresStatus(DEFAULT_TIRES_STATUS);
    toast({ title: "Tires Reset", description: "All tire details cleared." });
  };

  const handleApplyToAll = () => {
    if (!activeTire || readOnly) return;
    const { brand, size, dot, treadDepth } = tempTireData;
    setTiresStatus(prev => {
      const next = { ...prev };
      (Object.keys(next) as Array<keyof TiresStatus>).forEach(key => {
        if (key !== activeTire) {
          next[key] = { ...next[key], brand, size, dot, treadDepth };
        }
      });
      return next;
    });
    toast({ title: "Applied to All", description: "Details copied to all tires." });
  };

  const getTireColor = (condition: string) => {
    switch (condition) {
      case 'good': return '#10B981'; // emerald-500
      case 'fair': return '#F59E0B'; // amber-500
      case 'poor': return '#F97316'; // orange-500
      case 'replace': return '#EF4444'; // red-500
      default: return '#6B7280'; // gray-500
    }
  };

  const readOnly = !canEdit;

  const cycleStatus = (status: BodyStatus): BodyStatus => {
    switch (status) {
      case 'original':
        return 'painted';
      case 'painted':
        return 'putty';
      case 'putty':
        return 'replaced';
      default:
        return 'original';
    }
  };

  const fillForStatus = (status: BodyStatus) => {
    if (status === 'original') return '#e5e7eb';
    return paintColors[status];
  };

  // Memoize handlers to prevent SpecField re-renders
  const handleBrandChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, brand: v })), []);
  const handleModelChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, model: v })), []);
  const handleYearChange = React.useCallback((v: string) => {
    const numeric = v.replace(/[^0-9]/g, '').slice(0, 4);
    setCarInfo(prev => ({ ...prev, year: numeric }));
  }, []);
  const handleOwnersChange = React.useCallback((v: string) => {
    const numeric = v.replace(/[^0-9]/g, '');
    setCarInfo(prev => ({ ...prev, owners: numeric }));
  }, []);
  const handleMileageChange = React.useCallback((v: string) => {
    const numeric = v.replace(/[^0-9]/g, '');
    const formatted = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setCarInfo(prev => ({ ...prev, mileage: formatted }));
  }, []);
  const handleMulkiaChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, mulkiaExpiry: v })), []);
  const handleVinChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, vin: v })), []);

  const handlePhotoDelete = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground print:bg-white print:text-black">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Bar: Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? 'default' : 'outline'}>{isAdmin ? 'Admin' : 'User'}</Badge>
              <Badge variant={readOnly ? 'outline' : 'secondary'}>{readOnly ? 'Read Only' : 'Editing'}</Badge>
              {currentReportId && <Badge variant="outline" className="font-mono text-xs">{currentReportId}</Badge>}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to="/admin/reports">
                <Button size="sm" variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div className="h-4 w-px bg-border/50 mx-2" />
              <Input
                placeholder="Load ID..."
                value={currentReportId || ''}
                onChange={(e) => setCurrentReportId(e.target.value || undefined)}
                className="h-8 w-32 bg-background/50"
              />
              <Button size="sm" variant="ghost" onClick={() => loadReport(currentReportId)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
              </Button>
              <div className="h-4 w-px bg-border/50 mx-2" />
              <Button size="sm" variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || readOnly} className="gap-2 bg-luxury hover:bg-luxury/90 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint} className="print:hidden">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* SECTION 1: Photos (Top Priority) */}
            <div className="md:col-span-12">
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-luxury" />
                    Photos
                  </h3>
                  <Badge variant="outline">{photos.length} Uploaded</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-xl bg-muted/20 border border-border/50 overflow-hidden relative group">
                      <img src={photo.storage_path} alt={photo.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-white text-xs font-medium truncate w-full">{photo.label || 'Untitled'}</span>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhotoDelete(idx);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!readOnly && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-luxury/50 hover:bg-luxury/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-luxury"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs font-medium">Add Photo</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Vehicle Identity & Visuals */}

            {/* Vehicle Identity (Left) */}
            <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
              <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-luxury/10 rounded-xl flex items-center justify-center text-luxury">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">Vehicle Identity</h2>
                    <p className="text-xs text-muted-foreground">Core details</p>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="relative">
                    <SpecField
                      label="VIN Number"
                      value={carInfo.vin}
                      onChange={handleVinChange}
                      icon={FileText}
                      placeholder="17-Digit VIN"
                      readOnly={readOnly}
                      className={cn(
                        carInfo.vin.length === 17 ? "border-emerald-500/50 bg-emerald-500/5" : ""
                      )}
                    />
                    {carInfo.vin.length === 17 && (
                      <div className="absolute right-3 top-3 text-emerald-500">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    {!readOnly && (
                      <button
                        onClick={async () => {
                          if (!carInfo.vin || carInfo.vin.length < 17) {
                            toast({ title: "Invalid VIN", description: "Please enter a valid 17-character VIN.", variant: "destructive" });
                            return;
                          }
                          const toastId = toast({ title: "Decoding VIN...", description: "Fetching vehicle details..." });
                          try {
                            const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${carInfo.vin}?format=json`);
                            const data = await response.json();
                            if (data.Results) {
                              const getVal = (id: number) => data.Results.find((r: any) => r.VariableId === id)?.Value;
                              const make = getVal(26); const model = getVal(28); const year = getVal(29);
                              if (make || model || year) {
                                setCarInfo(prev => ({ ...prev, brand: make || prev.brand, model: model || prev.model, year: year || prev.year }));
                                toast({ title: "VIN Decoded", description: `Found: ${year} ${make} ${model}` });
                              } else {
                                toast({ title: "No Data Found", description: "Could not decode details.", variant: "destructive" });
                              }
                            }
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to fetch VIN details.", variant: "destructive" });
                          }
                        }}
                        className="absolute right-2 bottom-2 p-1.5 bg-luxury/10 text-luxury rounded-lg hover:bg-luxury/20 transition-colors"
                        title="Auto-fill details from VIN"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SpecField label="Brand" value={carInfo.brand} onChange={handleBrandChange} icon={Car} placeholder="Toyota" readOnly={readOnly} />
                    <SpecField label="Model" value={carInfo.model} onChange={handleModelChange} icon={Info} placeholder="Camry" readOnly={readOnly} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SpecField label="Year" value={carInfo.year} onChange={handleYearChange} icon={Calendar} placeholder="2024" readOnly={readOnly} />
                    <SpecField label="Mileage" value={carInfo.mileage} onChange={handleMileageChange} icon={Gauge} placeholder="0 km" readOnly={readOnly} />
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registration</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <SpecField label="Owners" value={carInfo.owners} onChange={handleOwnersChange} icon={Info} placeholder="1" readOnly={readOnly} />
                      <SpecField
                        label="Mulkia Expiry"
                        value={carInfo.mulkiaExpiry}
                        onChange={handleMulkiaChange}
                        icon={Calendar}
                        placeholder="YYYY-MM-DD"
                        type="date"
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Car Diagram (Center) */}
            <div className="md:col-span-12 lg:col-span-4 xl:col-span-6">
              <div className="bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl p-4 relative min-h-[600px] flex items-center justify-center overflow-hidden group">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury/5 via-transparent to-transparent opacity-50" />
                <div className="absolute top-6 left-0 w-full text-center">
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground/40">Interactive Inspection Diagram</span>
                </div>

                {/* Legend Overlay */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-3 rounded-2xl border border-border/20 shadow-sm text-xs z-10">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#EF4444]" /> Painted</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Replaced</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F97316]" /> Body Repair</div>
                </div>

                {/* SVG Diagram */}
                <div className="relative w-full max-w-[320px] aspect-[320/650] transform scale-90 sm:scale-100 transition-transform duration-500">
                  <svg viewBox="0 0 320 650" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>

                    {/* Shadow under the car */}
                    <ellipse cx="160" cy="325" rx="140" ry="280" fill="black" className="opacity-10 blur-xl" />

                    {/* --- WHEELS (Underneath body) --- */}
                    {/* Front Left */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <g onClick={() => handleTireClick('frontLeft')} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <path
                            d="M 20 130 Q 15 160 20 190 L 40 190 L 40 130 Z"
                            fill={getTireColor(tiresStatus.frontLeft.condition)}
                          />
                          <rect x="15" y="130" width="25" height="60" rx="8" fill={getTireColor(tiresStatus.frontLeft.condition)} />
                        </g>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold">Front Left</p>
                          <p className="capitalize">{tiresStatus.frontLeft.condition}</p>
                          {tiresStatus.frontLeft.dot && <p>DOT: {tiresStatus.frontLeft.dot}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Front Right */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <rect
                          x="280" y="130" width="25" height="60" rx="8"
                          fill={getTireColor(tiresStatus.frontRight.condition)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleTireClick('frontRight')}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold">Front Right</p>
                          <p className="capitalize">{tiresStatus.frontRight.condition}</p>
                          {tiresStatus.frontRight.dot && <p>DOT: {tiresStatus.frontRight.dot}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Rear Left */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <rect
                          x="15" y="400" width="25" height="60" rx="8"
                          fill={getTireColor(tiresStatus.rearLeft.condition)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleTireClick('rearLeft')}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold">Rear Left</p>
                          <p className="capitalize">{tiresStatus.rearLeft.condition}</p>
                          {tiresStatus.rearLeft.dot && <p>DOT: {tiresStatus.rearLeft.dot}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Rear Right */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <rect
                          x="280" y="400" width="25" height="60" rx="8"
                          fill={getTireColor(tiresStatus.rearRight.condition)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleTireClick('rearRight')}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold">Rear Right</p>
                          <p className="capitalize">{tiresStatus.rearRight.condition}</p>
                          {tiresStatus.rearRight.dot && <p>DOT: {tiresStatus.rearRight.dot}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>


                    {/* --- BODY PARTS --- */}

                    {/* Front Bumper */}
                    <path
                      d="M 60 110 C 60 110, 160 90, 260 110 L 260 85 C 260 60, 160 50, 60 85 Z"
                      fill={fillForStatus(bodyParts.frontBumper)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontBumper: cycleStatus(bodyParts.frontBumper) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Hood */}
                    <path
                      d="M 60 115 C 160 100, 160 100, 260 115 L 255 210 C 160 220, 160 220, 65 210 Z"
                      fill={fillForStatus(bodyParts.hood)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, hood: cycleStatus(bodyParts.hood) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Front Left Fender */}
                    <path
                      d="M 55 112 L 60 210 L 40 205 C 30 180, 30 140, 55 112 Z"
                      fill={fillForStatus(bodyParts.frontLeftFender)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontLeftFender: cycleStatus(bodyParts.frontLeftFender) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Front Right Fender */}
                    <path
                      d="M 265 112 L 260 210 L 280 205 C 290 180, 290 140, 265 112 Z"
                      fill={fillForStatus(bodyParts.frontRightFender)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontRightFender: cycleStatus(bodyParts.frontRightFender) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Windshield (Glass) */}
                    <path
                      d="M 65 215 C 160 225, 160 225, 255 215 L 245 260 C 160 270, 160 270, 75 260 Z"
                      fill="url(#glassGradient)"
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />

                    {/* Roof */}
                    <path
                      d="M 75 265 C 160 275, 160 275, 245 265 L 245 390 C 160 400, 160 400, 75 390 Z"
                      fill={fillForStatus(bodyParts.roof)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, roof: cycleStatus(bodyParts.roof) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Front Left Door */}
                    <path
                      d="M 40 215 L 70 220 L 70 305 L 35 300 C 30 270, 35 240, 40 215 Z"
                      fill={fillForStatus(bodyParts.frontLeftDoor)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontLeftDoor: cycleStatus(bodyParts.frontLeftDoor) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Front Right Door */}
                    <path
                      d="M 280 215 L 250 220 L 250 305 L 285 300 C 290 270, 285 240, 280 215 Z"
                      fill={fillForStatus(bodyParts.frontRightDoor)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontRightDoor: cycleStatus(bodyParts.frontRightDoor) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Rear Left Door */}
                    <path
                      d="M 35 305 L 70 310 L 70 390 L 40 385 C 35 360, 35 330, 35 305 Z"
                      fill={fillForStatus(bodyParts.rearLeftDoor)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearLeftDoor: cycleStatus(bodyParts.rearLeftDoor) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Rear Right Door */}
                    <path
                      d="M 285 305 L 250 310 L 250 390 L 280 385 C 285 360, 285 330, 285 305 Z"
                      fill={fillForStatus(bodyParts.rearRightDoor)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearRightDoor: cycleStatus(bodyParts.rearRightDoor) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Rear Window (Glass) */}
                    <path
                      d="M 75 395 C 160 405, 160 405, 245 395 L 250 435 C 160 445, 160 445, 70 435 Z"
                      fill="url(#glassGradient)"
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />

                    {/* Trunk */}
                    <path
                      d="M 70 440 C 160 450, 160 450, 250 440 L 260 520 C 160 530, 160 530, 60 520 Z"
                      fill={fillForStatus(bodyParts.trunk)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, trunk: cycleStatus(bodyParts.trunk) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Rear Left Fender */}
                    <path
                      d="M 40 390 L 65 435 L 55 520 C 35 500, 30 450, 40 390 Z"
                      fill={fillForStatus(bodyParts.rearLeftFender)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearLeftFender: cycleStatus(bodyParts.rearLeftFender) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Rear Right Fender */}
                    <path
                      d="M 280 390 L 255 435 L 265 520 C 285 500, 290 450, 280 390 Z"
                      fill={fillForStatus(bodyParts.rearRightFender)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearRightFender: cycleStatus(bodyParts.rearRightFender) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Rear Bumper */}
                    <path
                      d="M 60 525 C 160 535, 160 535, 260 525 L 260 550 C 160 565, 160 565, 60 550 Z"
                      fill={fillForStatus(bodyParts.rearBumper)}
                      stroke="#475569"
                      strokeWidth="1.5"
                      onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearBumper: cycleStatus(bodyParts.rearBumper) })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    />

                    {/* Headlights (Over bumper) */}
                    <path
                      d="M 65 105 L 90 108 L 85 90 Z"
                      fill="#fbbf24"
                      className="opacity-90 drop-shadow-lg"
                    />
                    <path
                      d="M 255 105 L 230 108 L 235 90 Z"
                      fill="#fbbf24"
                      className="opacity-90 drop-shadow-lg"
                    />

                  </svg>
                </div>
              </div>
            </div>

            {/* Mechanical & Overall (Right) */}
            <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
              {/* Overall Score */}
              <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Overall Condition</h3>
                  <Badge variant={overallCondition === 'excellent' ? 'default' : 'outline'} className="capitalize text-xs">
                    {overallCondition}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['excellent', 'good', 'fair', 'poor'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setOverallCondition(option)}
                      disabled={readOnly}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all border",
                        overallCondition === option
                          ? "bg-luxury text-white border-luxury shadow-md scale-[1.02]"
                          : "bg-background hover:bg-accent border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option === 'excellent' && <Sparkles className="w-4 h-4" />}
                      {option === 'good' && <Check className="w-4 h-4" />}
                      {option === 'fair' && <AlertTriangle className="w-4 h-4" />}
                      {option === 'poor' && <X className="w-4 h-4" />}
                      <span className="capitalize">{option}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mechanical Stats */}
              <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50 flex-1">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Wrench className="w-4 h-4 text-luxury" />
                  Mechanical Health
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {Object.entries(DEFAULT_CHECKLISTS).map(([key, def]) => {
                    const categoryData = mechanicalStatus[key];
                    const status = categoryData?.status || 'ok';
                    const issueCount = categoryData?.items?.filter(i => i.condition !== 'ok' && i.condition !== 'na').length || 0;

                    return (
                      <StatusIndicator
                        key={key}
                        label={def.label}
                        icon={
                          key === 'engine' ? Wrench :
                            key === 'transmission' ? Cog :
                              key === 'suspension' ? Disc :
                                key === 'brakes' ? Disc :
                                  key === 'ac' ? Disc :
                                    Disc
                        }
                        status={status}
                        issueCount={issueCount}
                        onClick={() => openMechanicalModal(key)}
                        readOnly={readOnly}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: Detailed Condition */}

            {/* Tires Section (Left) */}
            <div className="md:col-span-12 lg:col-span-6">
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-luxury/10 rounded-xl text-luxury">
                      <Disc className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Tires & Wheels</h3>
                      <p className="text-xs text-muted-foreground">Condition & Manufacturing Date</p>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleSetAllGood} className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set All to Good</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleClearAllTires} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear All</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {(Object.entries(tiresStatus) as [keyof TiresStatus, TireDetails][]).map(([key, details]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const color = getTireColor(details.condition);

                    return (
                      <div
                        key={key}
                        onClick={() => handleTireClick(key)}
                        className={cn(
                          "group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                          activeTire === key ? "bg-accent border-luxury/50 ring-1 ring-luxury/20" : "bg-card hover:bg-accent/50 border-border/40"
                        )}
                      >
                        <div className="w-1.5 self-stretch rounded-full shrink-0 my-1" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
                            {details.condition !== 'good' && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background">
                                {details.condition}
                              </Badge>
                            )}
                          </div>

                          <div className="font-semibold text-sm truncate">
                            {details.brand ? details.brand : <span className="text-muted-foreground/50 italic">No Brand</span>}
                            {details.size && <span className="text-muted-foreground font-normal ml-1.5 text-xs">{details.size}</span>}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {details.dot ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-mono text-foreground">{details.dot}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 opacity-50">
                                <Calendar className="w-3 h-3" />
                                <span>--</span>
                              </div>
                            )}
                            {details.treadDepth && (
                              <div className="flex items-center gap-1">
                                <Gauge className="w-3 h-3" />
                                <span>{details.treadDepth}mm</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-1.5 rounded-full bg-background border shadow-sm">
                            <Sparkles className="w-3 h-3 text-luxury" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-3 text-xs justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Good</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Fair</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Poor</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Replace</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interior Section (Right) */}
            <div className="md:col-span-12 lg:col-span-6">
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <Armchair className="w-5 h-5 text-luxury" />
                  Interior Condition
                </h3>
                <InteriorChecklist
                  data={interiorStatus}
                  onChange={setInteriorStatus}
                  readOnly={readOnly}
                />
              </div>
            </div>

            {/* SECTION 4: Summary */}

            {/* Report Summary (Full Width) */}
            <div className="md:col-span-12">
              <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-luxury" />
                  Report Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Painted Parts List */}
                  <div>
                    <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2">PAINTED PARTS</h4>
                    {Object.values(bodyParts).every((s) => s === 'original') ? (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <span className="text-sm font-medium text-emerald-600">Clean Title</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(bodyParts)
                          .filter(([_, status]) => status !== 'original')
                          .map(([part, status]) => {
                            let badgeColorClass = '';
                            if (status === 'painted') badgeColorClass = 'border-red-500 text-red-500 bg-red-500/10';
                            else if (status === 'replaced') badgeColorClass = 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
                            else if (status === 'putty') badgeColorClass = 'border-orange-500 text-orange-500 bg-orange-500/10';

                            return (
                              <Badge key={part} variant="outline" className={cn('capitalize text-[10px] px-2 py-0.5', badgeColorClass)}>
                                {part.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Comments Input */}
                  <div>
                    <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2">NOTES</h4>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add inspection notes..."
                      className="min-h-[120px] bg-background/50 resize-none text-sm"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Generate Report & Linking */}
              <div className="md:col-span-12">
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
                            <p className="font-medium text-sm">{linkedListing.make} {linkedListing.model}</p>
                            <p className="text-xs text-muted-foreground">{linkedListing.year}</p>
                          </div>
                          <Link to={`/listing/${linkedListing.id}`} className="text-xs text-luxury hover:underline">
                            View Listing →
                          </Link>
                        </div>
                      ) : (
                        <select
                          value={selectedListingId || 'none'}
                          onChange={(e) => handleListingChange(e.target.value)}
                          disabled={readOnly}
                          className="w-full h-11 px-3 rounded-xl bg-background/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-luxury/50 focus:border-luxury/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="none">No vehicle linked</option>
                          {availableListings.map((listing) => (
                            <option key={listing.id} value={listing.id}>
                              {listing.make} {listing.model} {listing.year}
                            </option>
                          ))}
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
                                toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
                              }}
                            >
                              <Share2 className="w-4 h-4" />
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
                        onClick={handleGenerateReport}
                        disabled={isGenerating || !currentReportId || readOnly}
                        className="gap-2 bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
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
                            onClick={handleUnfreezeReport}
                            className="gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Wrench className="w-4 h-4" />
                            Unlock for Editing
                          </Button>
                        )}
                      </>
                    )}

                    {!currentReportId && (
                      <p className="text-xs text-muted-foreground">
                        Save the report first before generating
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {activeCategory && (
        <MechanicalChecklistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categoryKey={activeCategory}
          data={mechanicalStatus[activeCategory]}
          onSave={handleMechanicalSave}
          readOnly={readOnly}
        />
      )}

      <Dialog open={isTireModalOpen} onOpenChange={setIsTireModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-border/50 shadow-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-luxury/10 rounded-full text-luxury">
                <Disc className="w-5 h-5" />
              </div>
              Update Tire Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tire-brand" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand</Label>
                <Input
                  id="tire-brand"
                  value={tempTireData.brand}
                  onChange={(e) => setTempTireData({ ...tempTireData, brand: e.target.value })}
                  className="h-10 rounded-xl bg-background/50"
                  placeholder="e.g. Michelin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tire-size" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</Label>
                <Input
                  id="tire-size"
                  value={tempTireData.size}
                  onChange={(e) => setTempTireData({ ...tempTireData, size: e.target.value })}
                  className="h-10 rounded-xl bg-background/50"
                  placeholder="e.g. 245/40R19"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tire-dot" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DOT (Year)</Label>
                <Input
                  id="tire-dot"
                  value={tempTireData.dot}
                  onChange={(e) => setTempTireData({ ...tempTireData, dot: e.target.value })}
                  className="h-10 rounded-xl bg-background/50 font-mono"
                  placeholder="e.g. 1224"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tire-depth" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tread Depth (mm)</Label>
                <Input
                  id="tire-depth"
                  value={tempTireData.treadDepth}
                  onChange={(e) => setTempTireData({ ...tempTireData, treadDepth: e.target.value })}
                  className="h-10 rounded-xl bg-background/50"
                  placeholder="e.g. 6.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tire-condition" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition</Label>
              <Select
                value={tempTireData.condition}
                onValueChange={(val: TireCondition) => setTempTireData({ ...tempTireData, condition: val })}
              >
                <SelectTrigger type="button" className="h-11 rounded-xl bg-background/50 border-border/50 focus:border-luxury/50 transition-all">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Good Condition
                    </div>
                  </SelectItem>
                  <SelectItem value="fair">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      Fair Wear
                    </div>
                  </SelectItem>
                  <SelectItem value="poor">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      Poor Condition
                    </div>
                  </SelectItem>
                  <SelectItem value="replace">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Replace Immediately
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={handleApplyToAll}
              className="w-full gap-2 text-muted-foreground hover:text-luxury hover:border-luxury/50 hover:bg-luxury/5"
            >
              <Copy className="w-4 h-4" />
              Apply Details to All Tires
            </Button>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsTireModalOpen(false)} className="rounded-xl hover:bg-muted/50">Cancel</Button>
            <Button onClick={handleTireSave} className="rounded-xl bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CarInspectionReport;

