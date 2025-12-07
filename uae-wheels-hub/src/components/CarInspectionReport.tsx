import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns'; // Added import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import EzcarLogo from './EzcarLogo';

import {
  TireDetails as TireDetailsType, // Renamed to avoid conflict with component
  TiresStatus,
  DEFAULT_TIRE_DETAILS,
  DEFAULT_TIRES_STATUS
} from '@/types/inspection';
import TireDetailsModal from './TireDetailsModal';
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
  getLinkedListing,
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
  ArrowLeft,
  Share2,
  Upload,
  Armchair,
  Sparkles,
  CheckCircle2,
  Trash2,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MechanicalChecklistModal, { MechanicalStatus, MechanicalCategory, DEFAULT_CHECKLISTS } from './MechanicalChecklistModal';
import InteriorChecklist, { InteriorStatus, DEFAULT_INTERIOR_STATUS } from './InteriorChecklist';
import ServiceHistoryTimeline from './ServiceHistoryTimeline';
import { ServiceRecord } from '@/types/inspection';



type Props = {
  reportId?: string;
  readOnly?: boolean;
  initialData?: any;
};

// Updated TireDetails type to include optional 'present'
interface TireDetails extends TireDetailsType {
  present?: boolean;
}

type BodyStatus = 'original' | 'painted' | 'replaced' | 'putty' | 'ppf';

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
  putty: '#8B5CF6', // Purple
  ppf: '#06b6d4', // Cyan
};

const normalizeStatus = (status?: BodyStatus): BodyStatus => status ?? 'original';

// Fixed DEFAULT_TIRES type to match TiresStatus
const DEFAULT_TIRES: TiresStatus = {
  frontLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  frontRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  rearLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  rearRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  spare: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '', present: true } // Added present flag
};

const statusToCondition = (status?: BodyStatus): { condition: ReportBodyPartInput['condition']; severity: number } => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'original':
      return { condition: 'ok', severity: 0 };
    case 'ppf':
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

const conditionToStatus = (condition: string, notes?: string | null): BodyStatus => {
  if (notes === 'PPF') return 'ppf';
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
        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 w-full group text-left print-show print-break-inside-avoid",
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
          "text-sm font-bold text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0",
          isDateType
            ? "h-8 px-2 border border-border/50 rounded-md bg-background/50 cursor-pointer"
            : "h-7 p-0 border-none bg-transparent"
        )}
      />
    </div>
  );
});
SpecField.displayName = 'SpecField';

const calculateHealthScore = (
  mechanical: MechanicalStatus,
  bodyParts: Record<string, BodyStatus>,
  tires: TiresStatus,
  interior: InteriorStatus
): number => {
  let score = 100;

  // 1. Mechanical (Max deduction 40)
  let mechDeduction = 0;
  Object.values(mechanical).forEach(cat => {
    if (cat.status === 'issue') mechDeduction += 5;
    if (cat.status === 'critical') mechDeduction += 15;
  });
  score -= Math.min(mechDeduction, 40);

  // 2. Body (Max deduction 30)
  let bodyDeduction = 0;
  Object.values(bodyParts).forEach(status => {
    if (status === 'painted') bodyDeduction += 2;
    if (status === 'replaced') bodyDeduction += 4;
    if (status === 'putty') bodyDeduction += 5;
  });
  score -= Math.min(bodyDeduction, 30);

  // 3. Tires (Max deduction 15)
  let tireDeduction = 0;
  // Check main 4 tires
  const tireKeys: (keyof TiresStatus)[] = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
  tireKeys.forEach(key => {
    const tire = tires[key];
    // @ts-ignore - covering base properties
    if (tire.condition === 'fair') tireDeduction += 1;
    // @ts-ignore
    if (tire.condition === 'poor') tireDeduction += 2;
    // @ts-ignore
    if (tire.condition === 'replace') tireDeduction += 4;
  });
  score -= Math.min(tireDeduction, 15);

  // 4. Interior (Max deduction 15)
  let interiorDeduction = 0;
  const interiorKeys = ['seats', 'dashboard', 'headliner', 'carpets', 'doorPanels', 'controls'] as const;
  interiorKeys.forEach(key => {
    const condition = interior[key];
    if (condition === 'fair') interiorDeduction += 2;
    if (condition === 'worn') interiorDeduction += 3;
    if (condition === 'stained') interiorDeduction += 3;
    if (condition === 'torn') interiorDeduction += 5;
    if (condition === 'poor') interiorDeduction += 5;
  });
  if (['smoke', 'mold', 'other'].includes(interior.odor)) interiorDeduction += 5;
  score -= Math.min(interiorDeduction, 15);

  return Math.max(0, Math.round(score));
};

const HealthScoreGauge = ({ score }: { score: number }) => {
  const radius = 38;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#ef4444'; // red
  if (score >= 90) color = '#10b981'; // emerald
  else if (score >= 70) color = '#f59e0b'; // amber

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transition-all duration-1000 ease-out"
      >
        <circle
          stroke="#334155"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="opacity-20"
        />
        <circle
          stroke={color}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white" style={{ color }}>{score}</span>
        <span className="text-[10px] text-white/60">/100</span>
      </div>
    </div>
  );
};

const CarInspectionReport: React.FC<Props> = ({ reportId, readOnly: forceReadOnly, initialData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const _linkedListingIdParam = searchParams.get('linked_listing_id');

  // Core State
  const [currentReportId, setCurrentReportId] = useState<string | undefined>(initialData?.id || reportId);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);

  // Permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [authorUserId, setAuthorUserId] = useState<string | null>(initialData?.author?.user_id || null);

  const isAuthor = !!(user?.id && authorUserId === user.id);

  // Report Content State
  const [inspectorName, setInspectorName] = useState(initialData?.author?.full_name || '');
  const [contactEmail, setContactEmail] = useState(initialData?.author?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initialData?.author?.contact_phone || '');

  const [carInfo, setCarInfo] = useState({
    brand: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year ? String(initialData.year) : new Date().getFullYear().toString(),
    mileage: initialData?.odometer_km ? String(initialData.odometer_km) : '',
    vin: initialData?.vin || '',
    location: initialData?.location || '',
    date: initialData?.inspection_date || new Date().toISOString().slice(0, 10),
    owners: initialData?.number_of_owners ? String(initialData.number_of_owners) : '',
    mulkiaExpiry: initialData?.mulkia_expiry || '',
    regionalSpecs: initialData?.regional_specs || '',
    bodyType: initialData?.body_type || '',
    fuelType: initialData?.fuel_type || '',
    engineSize: initialData?.engine_size || '',
    horsepower: initialData?.horsepower || '',
    color: initialData?.color || '',
    cylinders: initialData?.cylinders || '',
    transmission: initialData?.transmission || '',
    keys: initialData?.number_of_keys || '',
    options: initialData?.options || '',
  });

  const [overallCondition, setOverallCondition] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'salvage'>(initialData?.overall_condition || 'fair');
  const [summary, setSummary] = useState(initialData?.notes || ''); // Renamed from comment to summary

  const [bodyParts, setBodyParts] = useState<Record<string, BodyStatus>>(() => {
    const initial: Record<string, BodyStatus> = {};
    // Initialize all to original
    bodyPartKeys.forEach(part => {
      initial[part.key] = 'original';
    });
    // Override from initialData if present
    if (initialData?.body_parts) {
      initialData.body_parts.forEach((part: any) => {
        const status = conditionToStatus(part.condition);
        initial[part.part] = status;
      });
    }
    return initial;
  });

  const [mechanicalStatus, setMechanicalStatus] = useState<MechanicalStatus>(
    initialData?.mechanical_checklist || {}
  );

  const [tiresStatus, setTiresStatus] = useState<TiresStatus>(
    (initialData?.tires_status || DEFAULT_TIRES)
  );
  const [_tireDetails, _setTireDetails] = useState<TireDetails>(
    initialData?.tires_details || DEFAULT_TIRE_DETAILS
  );

  const [interiorStatus, setInteriorStatus] = useState<InteriorStatus>(
    initialData?.interior_status || DEFAULT_INTERIOR_STATUS
  );

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTire, setActiveTire] = useState<keyof TiresStatus | null>(null);
  const [isTireModalOpen, setIsTireModalOpen] = useState(false);
  const [tempTireData, setTempTireData] = useState<TireDetails>({ ...DEFAULT_TIRE_DETAILS });

  const [photos, setPhotos] = useState<
    { storage_path: string; label?: string; body_part_key?: string | null; sort_order?: number }[]
  >(initialData?.photos || []);

  const healthScore = useMemo(() => {
    return calculateHealthScore(mechanicalStatus, bodyParts, tiresStatus, interiorStatus);
  }, [mechanicalStatus, bodyParts, tiresStatus, interiorStatus]);

  // Report status and linking
  const [reportStatus, setReportStatus] = useState<ReportStatus>(initialData?.status || 'draft');
  const [shareSlug, setShareSlug] = useState<string | null>(initialData?.share_slug || null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(initialData?.listing?.id || null);

  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [availableListings, setAvailableListings] = useState<Array<{ id: string; title: string; make: string; model: string; year: number; vin?: string }>>([]);
  const [linkedListing, setLinkedListing] = useState<{ id: string; title: string; make: string; model: string; year: number } | null>(initialData?.listing || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportDisplayId, setReportDisplayId] = useState<string>(initialData?.display_id || ''); // Load Display ID

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Computed read-only state - forceReadOnly takes highest priority
  const canEdit = useMemo(() => {
    // forceReadOnly means absolutely no editing allowed (e.g., public view)
    if (forceReadOnly) return false;
    // If report is frozen, only admin can edit
    if (reportStatus === 'frozen' && !isAdmin) return false;
    if (isAdmin) return true;
    if (!user?.id) return false;
    if (!isWhitelisted) return false;
    if (!currentReportId) return true; // new report
    return authorUserId === user.id;
  }, [authorUserId, currentReportId, isAdmin, isWhitelisted, user?.id, reportStatus, forceReadOnly]);

  const _handlePrint = () => {
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
      setReportDisplayId(data.display_id || ''); // Load Display ID

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
        setSummary(decoded.comment || decoded.rawComment || ''); // Use summary
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
        if (decoded.serviceHistory) setServiceHistory(decoded.serviceHistory);
      } else {
        setSummary(data.summary || ''); // Use summary
      }

      if (data.body_parts?.length) {
        const mapped: Record<string, BodyStatus> = { ...bodyParts };
        data.body_parts.forEach((bp: any) => {
          mapped[bp.part] = conditionToStatus(bp.condition, bp.notes);
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

      toast({ title: 'Report loaded', description: `ID: ${id}`, duration: 2000 });
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
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to generate or save reports.", variant: "destructive" });
      return;
    }
    // If not saved yet, save first
    let reportId = currentReportId;
    if (!reportId) {
      if (!carInfo.vin) {
        toast({ title: "VIN Required", description: "Please enter VIN to generate report.", variant: "destructive" });
        return;
      }

      setIsGenerating(true);
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
          serviceHistory,
          comment: summary, // Use summary
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

        const payload: any = {
          author_id: authorId,
          vin: carInfo.vin,
          odometer_km: carInfo.mileage ? parseFloat(carInfo.mileage.replace(/,/g, '')) : null,
          inspection_date: carInfo.date,
          location: carInfo.location || null,
          overall_condition: overallCondition,
          summary: summaryPayload,
          display_id: reportDisplayId || undefined // Pass display_id if exists (usually generated on server for new, but keep consistency)
        };

        if (currentReportId) {
          payload.id = currentReportId;
        }
        // If we have a listing ID, include it
        if (selectedListingId) {
          payload.listing_id = selectedListingId;
        }

        const { id: savedId, display_id: savedDisplayId } = await saveReport(payload, bodyPartsPayload, photosPayload);

        if (savedDisplayId) {
          setReportDisplayId(savedDisplayId);
        }

        reportId = savedId;
        setCurrentReportId(savedId);
        setAuthorUserId(user.id);
        logReportAction('create', savedId, { vin: carInfo.vin });
      } catch (err: any) {
        toast({ title: "Save Failed", description: err.message, variant: "destructive" });
        setIsGenerating(false);
        return;
      }
    }

    if (!reportId) return;

    setIsGenerating(true);
    try {
      const result = await freezeReport(reportId);
      setReportStatus(result.status);
      setShareSlug(result.share_slug);

      // Auto-link if needed?
      if (selectedListingId && selectedListingId !== 'none' && !linkedListing) {
        await linkReportToListing(reportId, selectedListingId);
        // fetch linked listing details
        const listingDetails = await getLinkedListing(selectedListingId);
        setLinkedListing(listingDetails);
      }

      toast({
        title: 'Report Generated!',
        description: 'Report is now frozen and shareable.',
      });
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
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
        serviceHistory,
        comment: summary, // Use summary
      });

      const bodyPartsPayload = Object.entries(bodyParts).map(([part, status]) => {
        const mapped = statusToCondition(status as BodyStatus);
        return {
          part,
          condition: mapped.condition,
          severity: mapped.severity,
          notes: status === 'ppf' ? 'PPF' : null,
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

      const payload: any = {
        id: currentReportId,
        author_id: authorId,
        vin: carInfo.vin,
        odometer_km: carInfo.mileage ? parseFloat(carInfo.mileage.replace(/,/g, '')) : null,
        inspection_date: carInfo.date,
        location: carInfo.location || null,
        overall_condition: overallCondition,
        summary: summaryPayload,
        display_id: reportDisplayId || undefined
      };

      if (selectedListingId) {
        payload.listing_id = selectedListingId;
      }

      const { id: savedId, display_id: savedDisplayId } = await saveReport(payload, bodyPartsPayload, photosPayload);

      setCurrentReportId(savedId);
      if (savedDisplayId) setReportDisplayId(savedDisplayId);
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
        const file = files.item(i);
        if (!file) continue;
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

  // Track scroll position before opening modal
  const scrollPositionRef = React.useRef<number>(0);

  const openMechanicalModal = (key: string) => {
    // Save current scroll position before modal opens
    scrollPositionRef.current = window.scrollY;
    setActiveCategory(key);
    setIsModalOpen(true);

    // Use requestAnimationFrame to restore scroll position after React updates
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  };

  // Restore scroll position when modal closes
  React.useEffect(() => {
    if (!isModalOpen && scrollPositionRef.current > 0) {
      // Small delay to let dialog close animation complete
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

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
    setTiresStatus(DEFAULT_TIRES);
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

  const handleAutoFill = () => {
    const parts: string[] = [];

    // 1. Vehicle Identity
    const carYear = carInfo.year || 'N/A';
    const carMake = carInfo.brand || 'N/A';
    const carModel = carInfo.model || 'N/A';
    const vin = carInfo.vin || 'N/A';
    const odometer = carInfo.mileage ? parseFloat(carInfo.mileage.replace(/,/g, '')) : 0;

    parts.push(`Vehicle: ${carYear} ${carMake} ${carModel}`);
    parts.push(`VIN: ${vin}`);
    parts.push(`Odometer: ${odometer.toLocaleString()} km`);
    parts.push(`Overall Condition: ${overallCondition.charAt(0).toUpperCase() + overallCondition.slice(1)}`);
    parts.push(''); // spacer

    // 2. Body Analysis
    const paintedParts = Object.entries(bodyParts).filter(([_, status]) => status !== 'original');
    if (paintedParts.length > 0) {
      parts.push('Body Analysis:');
      const groupedByStatus: Record<string, string[]> = {};
      paintedParts.forEach(([part, status]) => {
        const statusLabel = status === 'painted' ? 'Painted' : status === 'replaced' ? 'Replaced' : status === 'putty' ? 'Putty' : status;
        if (!groupedByStatus[statusLabel]) groupedByStatus[statusLabel] = [];
        groupedByStatus[statusLabel].push(part.replace(/([A-Z])/g, ' $1').trim());
      });

      Object.entries(groupedByStatus).forEach(([status, pList]) => {
        parts.push(`- ${status}: ${pList.join(', ')}`);
      });
    } else {
      parts.push('Body Analysis: Clean title, no accidents or painted parts detected.');
    }
    parts.push('');

    // 3. Mechanical Health
    const issues: string[] = [];
    Object.entries(mechanicalStatus).forEach(([key, category]) => {
      if (category.status === 'issue' || category.status === 'critical') {
        const label = DEFAULT_CHECKLISTS[key]?.label || key;
        const faulyItems = category.items.filter(i => i.condition !== 'ok').map(i => i.label);

        let line = `- ${label}: ${category.status.toUpperCase()}`;
        if (faulyItems.length > 0) {
          line += ` (${faulyItems.join(', ')})`;
        }
        if (category.notes) {
          line += `. Note: ${category.notes}`;
        }
        issues.push(line);
      }
    });

    if (issues.length > 0) {
      parts.push('Mechanical Observations:');
      parts.push(...issues);
    } else {
      parts.push('Mechanical Observations: No major mechanical issues detected.');
    }
    parts.push('');

    // 4. Tires
    const tireIssues = Object.entries(tiresStatus).filter(([key, t]) =>
      // @ts-ignore
      (t.condition === 'poor' || t.condition === 'replace')
    );
    if (tireIssues.length > 0) {
      parts.push('Tires Attention Needed:');
      tireIssues.forEach(([key, t]) => {
        // @ts-ignore
        const label = key === 'frontLeft' ? 'Front Left' : key === 'frontRight' ? 'Front Right' : key === 'rearLeft' ? 'Rear Left' : key === 'rearRight' ? 'Rear Right' : 'Spare';
        // @ts-ignore
        parts.push(`- ${label}: ${t.condition} (${t.brand} ${t.size})`);
      });
    }

    setSummary(parts.join('\n'));
    toast({ title: "Auto-filled", description: "Summary generated from report details." });
  };

  const handleReset = () => {
    // Clear draft from storage
    localStorage.removeItem('ezcar_report_draft');

    // Reset all state to defaults
    setCarInfo({
      brand: '',
      model: '',
      year: new Date().getFullYear().toString(),
      mileage: '',
      vin: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      owners: '',
      mulkiaExpiry: '',
      regionalSpecs: '',
      bodyType: '',
      fuelType: '',
      engineSize: '',
      horsepower: '',
      color: '',
      cylinders: '',
      transmission: '',
      keys: '',
      options: '',
    });
    setOverallCondition('fair');
    setMechanicalStatus({});
    setTiresStatus(DEFAULT_TIRES_STATUS);
    setInteriorStatus({} as InteriorStatus);
    setServiceHistory([]);
    setBodyParts(bodyPartKeys.reduce((acc, part) => ({ ...acc, [part.key]: 'original' }), {} as Record<string, BodyStatus>));
    setPhotos([]);
    setSummary('');
    setInspectorName('');
    setContactEmail('');
    setContactPhone('');
    setSelectedListingId(null);
    setLinkedListing(null);

    toast({ title: "Form Reset", description: "Draft cleared and form reset to default." });
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

  const readOnly = forceReadOnly || !canEdit;

  const cycleStatus = (status?: BodyStatus): BodyStatus => {
    switch (status) {
      case 'original':
        return 'painted';
      case 'painted':
        return 'putty';
      case 'putty':
        return 'replaced';
      case 'replaced':
        return 'ppf';
      case 'ppf':
        return 'original';
      default:
        return 'original';
    }
  };

  const fillForStatus = (status?: BodyStatus) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'original') return 'url(#silver-gradient)';
    return paintColors[normalized];
  };

  // Memoize handlers to prevent SpecField re-renders
  // Auto-save draft to localStorage
  useEffect(() => {
    // Only save if we NOT editing an existing report (i.e. creating new)
    // AND not in read-only mode, waiting 1s debounce ideally, but direct is fine for now
    if (!currentReportId && !readOnly && !initialData) {
      const timer = setTimeout(() => {
        const draftData = {
          carInfo,
          mechanicalStatus,
          tiresStatus,
          interiorStatus,
          bodyParts,
          overallCondition,
          serviceHistory,
          summary, // Use summary
          inspectorName,
          contactEmail,
          contactPhone,
          photos: photos.map(p => ({ ...p, storage_path: p.storage_path })),
          timestamp: Date.now()
        };
        localStorage.setItem('ezcar_report_draft', JSON.stringify(draftData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [carInfo, mechanicalStatus, tiresStatus, interiorStatus, bodyParts, overallCondition, summary, inspectorName, contactEmail, contactPhone, photos, currentReportId, readOnly, initialData]);

  // Restore draft on mount
  useEffect(() => {
    // Only restore if starting fresh (no ID in URL, no initialData)
    // We check !currentReportId again to be safe
    if (!currentReportId && !initialData) {
      const savedDraft = localStorage.getItem('ezcar_report_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Optional: check timestamp to expire old drafts? For now, just restore.

          if (parsed.carInfo) setCarInfo(prev => ({ ...prev, ...parsed.carInfo }));
          if (parsed.mechanicalStatus) setMechanicalStatus(parsed.mechanicalStatus);
          if (parsed.tiresStatus) setTiresStatus(parsed.tiresStatus);
          if (parsed.interiorStatus) setInteriorStatus(parsed.interiorStatus);
          if (parsed.bodyParts) setBodyParts(parsed.bodyParts);
          if (parsed.overallCondition) setOverallCondition(parsed.overallCondition);
          if (parsed.serviceHistory) setServiceHistory(parsed.serviceHistory);
          if (parsed.summary) setSummary(parsed.summary); // Use summary
          if (parsed.inspectorName) setInspectorName(parsed.inspectorName);
          if (parsed.contactEmail) setContactEmail(parsed.contactEmail);
          if (parsed.contactPhone) setContactPhone(parsed.contactPhone);
          if (parsed.photos && Array.isArray(parsed.photos)) setPhotos(parsed.photos);

          toast({
            title: "Draft Restored",
            description: "Your previous unsaved report data has been restored.",
          });
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [initialData]); // Run once on mount

  // Clear draft when report ID is set (saved successfully)
  useEffect(() => {
    if (currentReportId) {
      localStorage.removeItem('ezcar_report_draft');
    }
  }, [currentReportId]);

  const handleBrandChange = useCallback((v: string) => setCarInfo(prev => ({ ...prev, brand: v })), []);
  const handleModelChange = useCallback((v: string) => setCarInfo(prev => ({ ...prev, model: v })), []);
  const handleYearChange = useCallback((v: string) => {
    const numeric = v.replace(/[^0-9]/g, '').slice(0, 4);
    setCarInfo(prev => ({ ...prev, year: numeric }));
  }, []);
  const handleOwnersChange = useCallback((v: string) => {
    const numeric = v.replace(/[^0-9]/g, '');
    setCarInfo(prev => ({ ...prev, owners: numeric }));
  }, []);
  const handleMileageChange = useCallback((v: string) => {
    const numeric = v.replace(/[^0-9]/g, '');
    const formatted = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setCarInfo(prev => ({ ...prev, mileage: formatted }));
  }, []);
  const handleMulkiaChange = useCallback((v: string) => setCarInfo(prev => ({ ...prev, mulkiaExpiry: v })), []);
  const handleVinChange = useCallback((v: string) => setCarInfo(prev => ({ ...prev, vin: v })), []);

  const handlePhotoDelete = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground print:bg-white print:text-black">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Bar: Controls - Only show in admin/editor mode, not in public view */}
          {!forceReadOnly && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm sticky top-2 z-30 print:hidden">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isAdmin ? 'default' : 'outline'}>{isAdmin ? 'Admin' : 'User'}</Badge>
                  <Badge variant={readOnly ? 'outline' : 'secondary'}>{readOnly ? 'Read Only' : 'Editing'}</Badge>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                  {/* Mobile Actions or simplified view could go here if needed */}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                {/* Wrapped controls for mobile */}
                <div className="flex w-full sm:w-auto gap-2">
                  <Link to="/admin/reports" className="flex-1 sm:flex-none">
                    <Button size="sm" variant="outline" className="gap-2 w-full">
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-destructive"
                    onClick={handleReset}
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
                      onChange={(e) => setCurrentReportId(e.target.value || undefined)}
                      className="h-9 sm:h-8 w-full sm:w-36 bg-background/50 text-base sm:text-sm"
                    />
                  )}
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                  {!currentReportId && (
                    <Button size="sm" variant="ghost" onClick={() => loadReport(currentReportId)} disabled={loading || !currentReportId} className="flex-1 sm:flex-none">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
                    </Button>
                  )}

                  <div className="h-4 w-px bg-border/50 mx-2 hidden sm:block" />

                  <Button size="sm" variant="outline" onClick={handleShare} className="gap-2 flex-1 sm:flex-none">
                    <Share2 className="w-4 h-4" />
                    <span className="sm:inline">Share</span>
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving || readOnly} className="gap-2 bg-luxury hover:bg-luxury/90 text-white flex-1 sm:flex-none">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </Button>

                </div>
              </div>
            </div>
          )}

          {/* REPORT HEADER */}
          <div className="bg-[#0f172a] text-white p-6 print:p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <EzcarLogo className="h-8 w-auto text-white" />
                  <div className="h-8 w-[1px] bg-white/20"></div>
                  <span className="text-sm font-medium tracking-wider text-white/80">INSPECTION REPORT</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Vehicle Condition Report</h1>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-white/50 uppercase tracking-wider mb-1">Health Score</span>
                  <HealthScoreGauge score={healthScore} />
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                <div className="text-right">
                  <div className="text-xs text-white/60 mb-1">Report ID</div>
                  <div className="text-xl font-mono font-bold text-luxury-400">{reportDisplayId || 'Generating...'}</div>
                  <div className="text-xs text-white/60 mt-2">Inspection Date</div>
                  <div className="font-medium">{format(new Date(carInfo.date), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-4 md:p-8 space-y-8 print:p-4">

            {/* Main Inspection Content */}
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print-grid">

              {/* SECTION 1: Photos (Top Priority) */}
              <div className="md:col-span-12 print-col-12">
                <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm card-print-clean">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Camera className="w-5 h-5 text-luxury" />
                      Inspection Photos
                    </h3>
                    <div className="flex items-center gap-2 print:hidden">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                      />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={readOnly || saving}>
                        <Upload className="w-4 h-4 mr-2" />
                        Add Photos
                      </Button>
                    </div>
                  </div>

                  {photos.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl print:hidden">
                      No photos added yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print-photos-grid">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-muted print-photo-item print-break-inside-avoid">
                          <img src={photo.storage_path} alt={photo.label || 'Car photo'} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
                            {!readOnly && (
                              <Button variant="destructive" size="icon" onClick={() => handlePhotoDelete(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {photo.label && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                              {photo.label}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Vehicle Identity & Visuals */}

              {/* Vehicle Identity (Left) */}
              <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4 print-col-4">
                <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm flex flex-col h-full card-print-clean">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="md:col-span-12 lg:col-span-4 xl:col-span-6 lg:order-none print-col-4 print-break-inside-avoid">
                <div className="bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl p-4 relative min-h-[500px] sm:min-h-[600px] flex items-center justify-center overflow-hidden group card-print-clean print:min-h-[300px] print:h-[400px]">
                  {/* Background Elements */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury/5 via-transparent to-transparent opacity-50" />
                  <div className="absolute top-6 left-0 w-full text-center">
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground/40">Interactive Inspection Diagram</span>
                  </div>

                  {/* Legend Overlay */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-3 rounded-2xl border border-border/20 shadow-sm text-xs z-10 print:hidden">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#EF4444]" /> Painted</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Replaced</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Body Repair</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#06b6d4]" /> PPF</div>
                  </div>

                  {/* SVG Diagram - Premium Sedan Design */}
                  <div className="relative w-full max-w-[340px] aspect-[340/700] transform scale-95 sm:scale-100 transition-transform duration-500 mx-auto">
                    <svg viewBox="0 0 340 700" className="w-full h-full drop-shadow-2xl filter saturate-[1.1]">
                      <defs>
                        {/* Premium Metallic Gradient */}
                        <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#d1d5db" /> {/* gray-300 */}
                          <stop offset="20%" stopColor="#f3f4f6" /> {/* gray-100 */}
                          <stop offset="50%" stopColor="#ffffff" /> {/* white */}
                          <stop offset="80%" stopColor="#f3f4f6" /> {/* gray-100 */}
                          <stop offset="100%" stopColor="#d1d5db" /> {/* gray-300 */}
                        </linearGradient>

                        {/* Glass Gradient */}
                        <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.7" />
                          <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.6" />
                        </linearGradient>

                        {/* Rim/Chrome Gradient */}
                        <linearGradient id="chrome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f8fafc" />
                          <stop offset="50%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#f8fafc" />
                        </linearGradient>

                        {/* Headlight Glow */}
                        <filter id="light-glow">
                          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Shadow Ground */}
                      <ellipse cx="170" cy="350" rx="160" ry="330" fill="black" className="opacity-20 blur-2xl" />

                      {/* --- TIRES (Underbody) --- */}
                      {/* Front Left */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <g onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTireClick('frontLeft'); }} className="cursor-pointer hover:brightness-110 transition-all">
                            <rect x="25" y="140" width="30" height="70" rx="8" fill="#1f2937" />
                            <rect x="25" y="140" width="30" height="70" rx="8" fill={getTireColor(tiresStatus.frontLeft.condition)} className="opacity-40" />
                            {/* Tread Detail */}
                            <path d="M25 150 H55 M25 160 H55 M25 170 H55 M25 180 H55 M25 190 H55 M25 200 H55" stroke="#374151" strokeOpacity="0.5" strokeWidth="1" />
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
                          <g onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTireClick('frontRight'); }} className="cursor-pointer hover:brightness-110 transition-all">
                            <rect x="285" y="140" width="30" height="70" rx="8" fill="#1f2937" />
                            <rect x="285" y="140" width="30" height="70" rx="8" fill={getTireColor(tiresStatus.frontRight.condition)} className="opacity-40" />
                            <path d="M285 150 H315 M285 160 H315 M285 170 H315 M285 180 H315 M285 190 H315 M285 200 H315" stroke="#374151" strokeOpacity="0.5" strokeWidth="1" />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">Front Right</p>
                            <p className="capitalize">{tiresStatus.frontRight.condition}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {/* Rear Left */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <g onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTireClick('rearLeft'); }} className="cursor-pointer hover:brightness-110 transition-all">
                            <rect x="25" y="460" width="30" height="70" rx="8" fill="#1f2937" />
                            <rect x="25" y="460" width="30" height="70" rx="8" fill={getTireColor(tiresStatus.rearLeft.condition)} className="opacity-40" />
                            <path d="M25 470 H55 M25 480 H55 M25 490 H55 M25 500 H55 M25 510 H55 M25 520 H55" stroke="#374151" strokeOpacity="0.5" strokeWidth="1" />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">Rear Left</p>
                            <p className="capitalize">{tiresStatus.rearLeft.condition}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {/* Rear Right */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <g onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTireClick('rearRight'); }} className="cursor-pointer hover:brightness-110 transition-all">
                            <rect x="285" y="460" width="30" height="70" rx="8" fill="#1f2937" />
                            <rect x="285" y="460" width="30" height="70" rx="8" fill={getTireColor(tiresStatus.rearRight.condition)} className="opacity-40" />
                            <path d="M285 470 H315 M285 480 H315 M285 490 H315 M285 500 H315 M285 510 H315 M285 520 H315" stroke="#374151" strokeOpacity="0.5" strokeWidth="1" />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">Rear Right</p>
                            <p className="capitalize">{tiresStatus.rearRight.condition}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>


                      {/* --- MAIN BODY CHASSIS --- */}

                      {/* Front Bumper - Curved & Aerodynamic */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 60 110 C 60 110, 170 80, 280 110 C 280 110, 280 70, 250 50 C 200 20, 140 20, 90 50 C 60 70, 60 110, 60 110 Z"
                            fill={fillForStatus(bodyParts.frontBumper)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontBumper: cycleStatus(bodyParts.frontBumper) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Front Bumper: {bodyParts.frontBumper === 'original' ? 'Original' : bodyParts.frontBumper}</TooltipContent>
                      </Tooltip>

                      {/* Hood - Sculpted Lines */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 60 110 C 60 110, 170 80, 280 110 L 270 230 C 270 230, 170 215, 70 230 L 60 110 Z"
                            fill={fillForStatus(bodyParts.hood)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, hood: cycleStatus(bodyParts.hood) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Hood: {bodyParts.hood === 'original' ? 'Original' : bodyParts.hood}</TooltipContent>
                      </Tooltip>
                      {/* Hood Detail Lines */}
                      <path d="M 120 120 C 120 120, 130 200, 110 220" fill="none" stroke="black" strokeOpacity="0.05" strokeWidth="2" className="pointer-events-none" />
                      <path d="M 220 120 C 220 120, 210 200, 230 220" fill="none" stroke="black" strokeOpacity="0.05" strokeWidth="2" className="pointer-events-none" />


                      {/* Front Fenders */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 60 110 L 70 230 L 40 220 C 40 220, 25 150, 60 110 Z"
                            fill={fillForStatus(bodyParts.frontLeftFender)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontLeftFender: cycleStatus(bodyParts.frontLeftFender) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Front Left Fender: {bodyParts.frontLeftFender === 'original' ? 'Original' : bodyParts.frontLeftFender}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 280 110 L 270 230 L 300 220 C 300 220, 315 150, 280 110 Z"
                            fill={fillForStatus(bodyParts.frontRightFender)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontRightFender: cycleStatus(bodyParts.frontRightFender) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Front Right Fender: {bodyParts.frontRightFender === 'original' ? 'Original' : bodyParts.frontRightFender}</TooltipContent>
                      </Tooltip>

                      {/* Windshield - Glass Effect */}
                      <path
                        d="M 70 230 C 170 215, 170 215, 270 230 L 260 290 C 170 280, 170 280, 80 290 Z"
                        fill="url(#glass-gradient)"
                        stroke="#e2e8f0" strokeWidth="1"
                      />

                      {/* Roof - Smooth */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 80 290 C 170 280, 170 280, 260 290 L 255 420 C 170 410, 170 410, 85 420 Z"
                            fill={fillForStatus(bodyParts.roof)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, roof: cycleStatus(bodyParts.roof) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Roof: {bodyParts.roof === 'original' ? 'Original' : bodyParts.roof}</TooltipContent>
                      </Tooltip>

                      {/* Front Doors */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 40 220 L 80 290 L 85 400 L 40 400 C 35 350, 35 300, 40 220 Z"
                            fill={fillForStatus(bodyParts.frontLeftDoor)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontLeftDoor: cycleStatus(bodyParts.frontLeftDoor) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Front Left Door: {bodyParts.frontLeftDoor === 'original' ? 'Original' : bodyParts.frontLeftDoor}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 300 220 L 260 290 L 255 400 L 300 400 C 305 350, 305 300, 300 220 Z"
                            fill={fillForStatus(bodyParts.frontRightDoor)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontRightDoor: cycleStatus(bodyParts.frontRightDoor) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Front Right Door: {bodyParts.frontRightDoor === 'original' ? 'Original' : bodyParts.frontRightDoor}</TooltipContent>
                      </Tooltip>
                      {/* Mirrors */}
                      <path d="M 45 230 L 20 225 L 20 245 L 43 245 Z" fill="#374151" />
                      <path d="M 295 230 L 320 225 L 320 245 L 297 245 Z" fill="#374151" />


                      {/* Rear Doors */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 40 400 L 85 400 L 85 420 L 70 500 L 40 480 C 35 450, 35 420, 40 400 Z"
                            fill={fillForStatus(bodyParts.rearLeftDoor)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearLeftDoor: cycleStatus(bodyParts.rearLeftDoor) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Rear Left Door: {bodyParts.rearLeftDoor === 'original' ? 'Original' : bodyParts.rearLeftDoor}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 300 400 L 255 400 L 255 420 L 270 500 L 300 480 C 305 450, 305 420, 300 400 Z"
                            fill={fillForStatus(bodyParts.rearRightDoor)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearRightDoor: cycleStatus(bodyParts.rearRightDoor) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Rear Right Door: {bodyParts.rearRightDoor === 'original' ? 'Original' : bodyParts.rearRightDoor}</TooltipContent>
                      </Tooltip>

                      {/* Rear Window */}
                      <path
                        d="M 85 420 C 170 410, 170 410, 255 420 L 265 470 C 170 480, 170 480, 75 470 Z"
                        fill="url(#glass-gradient)"
                        stroke="#e2e8f0" strokeWidth="1"
                      />

                      {/* Trunk */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 75 470 C 170 480, 170 480, 265 470 L 260 580 C 170 590, 170 590, 80 580 Z"
                            fill={fillForStatus(bodyParts.trunk)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, trunk: cycleStatus(bodyParts.trunk) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Trunk: {bodyParts.trunk === 'original' ? 'Original' : bodyParts.trunk}</TooltipContent>
                      </Tooltip>

                      {/* Rear Fenders */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 70 500 L 80 580 L 50 600 C 40 570, 40 520, 70 500 Z"
                            fill={fillForStatus(bodyParts.rearLeftFender)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearLeftFender: cycleStatus(bodyParts.rearLeftFender) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Rear Left Fender: {bodyParts.rearLeftFender === 'original' ? 'Original' : bodyParts.rearLeftFender}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 270 500 L 260 580 L 290 600 C 300 570, 300 520, 270 500 Z"
                            fill={fillForStatus(bodyParts.rearRightFender)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearRightFender: cycleStatus(bodyParts.rearRightFender) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Rear Right Fender: {bodyParts.rearRightFender === 'original' ? 'Original' : bodyParts.rearRightFender}</TooltipContent>
                      </Tooltip>

                      {/* Rear Bumper */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <path
                            d="M 50 600 C 50 600, 170 610, 290 600 L 290 630 C 290 650, 250 670, 170 670 C 90 670, 50 650, 50 630 Z"
                            fill={fillForStatus(bodyParts.rearBumper)}
                            stroke="#9ca3af" strokeWidth="1"
                            className="cursor-pointer hover:opacity-90 transition-all hover:stroke-luxury"
                            onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearBumper: cycleStatus(bodyParts.rearBumper) })}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Rear Bumper: {bodyParts.rearBumper === 'original' ? 'Original' : bodyParts.rearBumper}</TooltipContent>
                      </Tooltip>

                      {/* Headlights */}
                      <path d="M 70 55 L 100 65 L 90 45 Z" fill="#fbbf24" style={{ filter: 'url(#light-glow)' }} className="opacity-80" />
                      <path d="M 270 55 L 240 65 L 250 45 Z" fill="#fbbf24" style={{ filter: 'url(#light-glow)' }} className="opacity-80" />

                      {/* Taillights */}
                      <path d="M 60 620 L 90 615 L 90 630 Z" fill="#ef4444" className="opacity-80" />
                      <path d="M 280 620 L 250 615 L 250 630 Z" fill="#ef4444" className="opacity-80" />

                    </svg>
                  </div>
                </div>
              </div>

              {/* Mechanical & Overall (Right) */}
              <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4 print-col-4">
                {/* Overall Score */}
                <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm card-print-clean">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 print-mechanical-grid">
                    {Object.entries(DEFAULT_CHECKLISTS).map(([key, def]) => {
                      const categoryData = mechanicalStatus[key];
                      const status = categoryData?.status;
                      const issueCount = categoryData?.items?.filter(i => i.condition !== 'ok' && i.condition !== 'na').length || 0;

                      return (
                        <div key={key} className="print-mechanical-item">
                          <StatusIndicator
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Detailed Condition */}

              {/* Tires Section (Left) - Full Width in Print */}
              <div className="md:col-span-12 lg:col-span-6 print-col-12 print-break-inside-avoid">
                <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm h-full flex flex-col card-print-clean">
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
                    {(Object.entries(tiresStatus) as [keyof TiresStatus, TireDetails][])
                      .filter(([key]) => key !== 'spare')
                      .map(([key, details]) => {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const color = getTireColor(details.condition);

                        return (
                          <div
                            key={key}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTireClick(key); }}
                            className={cn(
                              "group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.98]",
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

                              {/* Manufacturing Date (DOT) - Prominent */}
                              <div className="font-semibold text-sm">
                                {details.dot ? (
                                  <span className="text-foreground font-mono">{details.dot}</span>
                                ) : (
                                  <span className="text-muted-foreground/50 italic">No Date</span>
                                )}
                              </div>

                              {/* Brand and other details - Secondary */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {details.brand ? (
                                  <span>{details.brand}</span>
                                ) : (
                                  <span className="opacity-50">No Brand</span>
                                )}
                                {details.size && <span className="font-mono">{details.size}</span>}
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
                    {/* Spare Tire Checkbox */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                          <Disc className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Spare Tire Present</span>
                      </div>
                      {readOnly ? (
                        <div className="flex items-center gap-2">
                          {tiresStatus.spare?.present !== false ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-red-500" />}
                          <span className="text-sm">{tiresStatus.spare?.present !== false ? 'Yes' : 'No'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTiresStatus({ ...tiresStatus, spare: { ...tiresStatus.spare, present: !tiresStatus.spare?.present } })}>
                          <div className={cn("w-6 h-6 rounded border flex items-center justify-center transition-colors", tiresStatus.spare?.present !== false ? "bg-luxury border-luxury text-white" : "border-input bg-background")}>
                            {tiresStatus.spare?.present !== false && <Check className="w-4 h-4" />}
                          </div>
                        </div>
                      )}
                    </div>
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
              <div className="md:col-span-12 lg:col-span-6 print-col-6 print-break-inside-avoid">
                <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm card-print-clean">
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
              <div className="md:col-span-12 print-col-12 print-break-inside-avoid">
                <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50 card-print-clean">
                  <h3 className="font-semibold mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-luxury" />
                      Report Summary
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        className="text-xs flex items-center gap-1.5 bg-luxury hover:bg-luxury/90 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-fill Template
                      </button>
                    )}
                  </h3>

                  <div className="space-y-6">
                    {/* Painted Parts List */}
                    <div>
                      <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2">PAINTED PARTS / BODY ANALYSIS</h4>
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

                    {/* Unified Notes Input */}
                    <div>
                      <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2">INSPECTOR NOTES</h4>
                      {readOnly ? (
                        <div className="w-full min-h-[150px] p-4 rounded-xl border border-border bg-background/50 text-sm leading-relaxed whitespace-pre-wrap">
                          {summary || <span className="text-muted-foreground italic">No notes added.</span>}
                        </div>
                      ) : (
                        <textarea
                          value={summary || ''}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="Enter detailed summary notes here..."
                          className="w-full min-h-[150px] p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-luxury/20 focus:border-luxury resize-y text-sm leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                </div>


                {/* Service History Timeline */}
                <div className="space-y-4 print-break-inside-avoid mt-8">
                  <ServiceHistoryTimeline
                    records={serviceHistory}
                    onChange={setServiceHistory}
                    readOnly={readOnly}
                  />
                </div>

                {/* Disclaimer Footer */}
                <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground print:mt-4 print:pt-4">
                  <p className="font-medium">Disclaimer</p>
                  <p className="mt-1 max-w-2xl mx-auto">
                    This report is a preliminary visual inspection only. Ezcar24.com and its inspectors are not responsible for any hidden defects, mechanical failures, or discrepancies that may arise after the inspection. This report does not constitute a warranty or guarantee of the vehicle's condition. All data is provided "as is".
                  </p>
                </div>


                {/* SECTION 5: Generate Report & Linking - Only show in admin/editor mode */}
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
                                <p className="font-medium text-sm">{linkedListing.make} {linkedListing.model}</p>
                                <p className="text-xs text-muted-foreground">{linkedListing.year}</p>
                              </div>
                              <Link to={`/car/${linkedListing.id}`} className="text-xs text-luxury hover:underline">
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
                              {availableListings
                                .filter(l => l.make || l.model || l.title)
                                .map((listing) => {
                                  const label = [listing.make, listing.model, listing.year].filter(Boolean).join(' ') || listing.title || 'Untitled Vehicle';
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
                                    toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
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
                            onClick={handleGenerateReport}
                            disabled={isGenerating || readOnly}
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
                )}

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
            title={DEFAULT_CHECKLISTS[activeCategory]?.label || 'Mechanical Details'}
            readOnly={readOnly}
          />
        )}

        {/* Tire Detail Modal */}
        {activeTire && (
          <TireDetailsModal
            isOpen={isTireModalOpen}
            onClose={() => setIsTireModalOpen(false)}
            tireData={tempTireData}
            onDataChange={setTempTireData}
            onSave={handleTireSave}
            onApplyToAll={handleApplyToAll}
            readOnly={readOnly}
          />
        )}
      </div>
    </TooltipProvider >
  );
};

export default CarInspectionReport;
