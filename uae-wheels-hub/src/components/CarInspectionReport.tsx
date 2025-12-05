import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  type ReportBodyPartInput,
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
  onClick,
  icon: Icon,
  readOnly,
}: {
  label: string;
  status: 'ok' | 'issue' | 'critical' | 'na' | undefined;
  onClick: () => void;
  icon: any;
  readOnly?: boolean;
}) => {
  let colorClass = 'bg-gray-100 text-gray-400 border-gray-200';
  if (status === 'ok') colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (status === 'issue') colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  if (status === 'critical') colorClass = 'bg-red-500/10 text-red-600 border-red-500/20';
  if (status === 'na') colorClass = 'bg-muted text-muted-foreground border-border';

  return (
    <button
      onClick={onClick}
      // disabled={readOnly} // Allow clicking even in read-only to view details
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 w-full",
        colorClass,
        readOnly && "hover:scale-100 active:scale-100 cursor-pointer"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
        status === 'ok' ? "bg-emerald-500/20" :
          status === 'issue' ? "bg-amber-500/20" :
            status === 'critical' ? "bg-red-500/20" :
              "bg-gray-200"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-semibold">{label}</span>
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
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon: any;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
}) => (
  <div className="group relative bg-background/50 hover:bg-background/80 transition-colors rounded-xl p-3 border border-border/40 hover:border-border/80 h-full flex flex-col justify-center">
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
      <Icon className="w-3.5 h-3.5 text-luxury/70" />
      {label}
    </div>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={readOnly}
      className="h-7 p-0 border-none bg-transparent text-sm font-semibold placeholder:text-muted-foreground/30 focus-visible:ring-0"
    />
  </div>
));
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
  const [tempTireData, setTempTireData] = useState<{ year: string; condition: string }>({ year: '', condition: 'good' });

  const [photos, setPhotos] = useState<
    { storage_path: string; label?: string; body_part_key?: string | null; sort_order?: number }[]
  >([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canEdit = useMemo(() => {
    if (isAdmin) return true;
    if (!user?.id) return false;
    if (!isWhitelisted) return false;
    if (!currentReportId) return true; // new report
    return authorUserId === user.id;
  }, [authorUserId, currentReportId, isAdmin, isWhitelisted, user?.id]);

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
        hasAdminRole(),
        isWhitelistedReportAuthor(user.id),
      ]);
      setIsAdmin(!!adminFlag);
      setIsWhitelisted(!!whitelistFlag);
    };
    check();
  }, [user?.id]);

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
    setTempTireData({
      year: tiresStatus[tireKey].dot || '',
      condition: tiresStatus[tireKey].condition || 'good'
    });
    setIsTireModalOpen(true);
  };

  const handleTireSave = () => {
    if (!activeTire) return;
    setTiresStatus(prev => ({
      ...prev,
      [activeTire]: {
        ...prev[activeTire],
        dot: tempTireData.year,
        condition: tempTireData.condition as any
      }
    }));
    setIsTireModalOpen(false);
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
  const handleYearChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, year: v })), []);
  const handleOwnersChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, owners: v })), []);
  const handleMileageChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, mileage: v })), []);
  const handleMulkiaChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, mulkiaExpiry: v })), []);
  const handleVinChange = React.useCallback((v: string) => setCarInfo(prev => ({ ...prev, vin: v })), []);

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
              <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-luxury/10 rounded-xl flex items-center justify-center text-luxury">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">Vehicle Identity</h2>
                    <p className="text-xs text-muted-foreground">Core details</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <SpecField label="VIN Number" value={carInfo.vin} onChange={handleVinChange} icon={FileText} placeholder="17-Digit VIN" readOnly={readOnly} />
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
                                toast({ id: toastId.id, title: "VIN Decoded", description: `Found: ${year} ${make} ${model}` });
                              } else {
                                toast({ id: toastId.id, title: "No Data Found", description: "Could not decode details.", variant: "destructive" });
                              }
                            }
                          } catch (error) {
                            toast({ id: toastId.id, title: "Error", description: "Failed to fetch VIN details.", variant: "destructive" });
                          }
                        }}
                        className="absolute right-2 top-8 p-1 bg-luxury/10 text-luxury rounded hover:bg-luxury/20 transition-colors"
                        title="Auto-fill details from VIN"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <SpecField label="Brand" value={carInfo.brand} onChange={handleBrandChange} icon={Car} placeholder="Toyota" readOnly={readOnly} />
                  <SpecField label="Model" value={carInfo.model} onChange={handleModelChange} icon={Info} placeholder="Camry" readOnly={readOnly} />
                  <div className="grid grid-cols-2 gap-2">
                    <SpecField label="Year" value={carInfo.year} onChange={handleYearChange} icon={Calendar} placeholder="2024" readOnly={readOnly} />
                    <SpecField label="Owners" value={carInfo.owners} onChange={handleOwnersChange} icon={Info} placeholder="1" readOnly={readOnly} />
                  </div>
                  <SpecField label="Mileage" value={carInfo.mileage} onChange={handleMileageChange} icon={Gauge} placeholder="0 km" readOnly={readOnly} />
                  <SpecField label="Mulkia Expiry" value={carInfo.mulkiaExpiry} onChange={handleMulkiaChange} icon={Calendar} placeholder="YYYY-MM-DD" readOnly={readOnly} />
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
                    <path
                      d="M 20 130 Q 15 160 20 190 L 40 190 L 40 130 Z"
                      fill={getTireColor(tiresStatus.frontLeft.condition)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleTireClick('frontLeft')}
                    />
                    <rect x="15" y="130" width="25" height="60" rx="8" fill={getTireColor(tiresStatus.frontLeft.condition)} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleTireClick('frontLeft')} />

                    {/* Front Right */}
                    <rect x="280" y="130" width="25" height="60" rx="8" fill={getTireColor(tiresStatus.frontRight.condition)} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleTireClick('frontRight')} />

                    {/* Rear Left */}
                    <rect x="15" y="400" width="25" height="60" rx="8" fill={getTireColor(tiresStatus.rearLeft.condition)} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleTireClick('rearLeft')} />

                    {/* Rear Right */}
                    <rect x="280" y="400" width="25" height="60" rx="8" fill={getTireColor(tiresStatus.rearRight.condition)} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleTireClick('rearRight')} />


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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Overall Condition</h3>
                  <Badge variant={overallCondition === 'excellent' ? 'default' : 'outline'} className="capitalize text-xs">
                    {overallCondition}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['excellent', 'good', 'fair', 'poor'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setOverallCondition(option)}
                      disabled={readOnly}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-medium transition-all border",
                        overallCondition === option
                          ? "bg-luxury text-white border-luxury shadow-md"
                          : "bg-background hover:bg-accent border-transparent hover:border-border text-muted-foreground"
                      )}
                    >
                      {option}
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
                  {Object.entries(DEFAULT_CHECKLISTS).map(([key, def]) => (
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
                      status={mechanicalStatus[key]?.status || 'ok'}
                      onClick={() => openMechanicalModal(key)}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3: Detailed Condition */}

            {/* Tires Section (Left) */}
            <div className="md:col-span-12 lg:col-span-6">
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm h-full flex flex-col justify-center items-center text-center space-y-4">
                <div className="p-4 bg-luxury/5 rounded-full">
                  <Disc className="w-8 h-8 text-luxury" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Tires & Wheels</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Click on the wheels in the diagram above to update their condition and year.
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Good</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Fair</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Poor</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Replace</div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tire Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tire-year" className="text-right">
                Year
              </Label>
              <Input
                id="tire-year"
                value={tempTireData.year}
                onChange={(e) => setTempTireData({ ...tempTireData, year: e.target.value })}
                className="col-span-3"
                placeholder="e.g. 2023"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tire-condition" className="text-right">
                Condition
              </Label>
              <Select
                value={tempTireData.condition}
                onValueChange={(val) => setTempTireData({ ...tempTireData, condition: val })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="replace">Replace Immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTireModalOpen(false)}>Cancel</Button>
            <Button onClick={handleTireSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CarInspectionReport;

