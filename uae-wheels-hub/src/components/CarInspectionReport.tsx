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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  ensureAuthorForUser,
  getReportWithDetails,
  hasAdminRole,
  isWhitelistedReportAuthor,
  logReportAction,
  saveReport,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const [photos, setPhotos] = useState<
    { storage_path: string; label?: string; body_part_key?: string | null; sort_order?: number }[]
  >([]);

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
        }));
        setComment(decoded.comment || decoded.rawComment || '');
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
        carInfo: { brand: carInfo.brand, model: carInfo.model, year: carInfo.year },
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

  const StatusIndicator = ({
    label,
    status,
    onClick,
    icon: Icon,
  }: {
    label: string;
    status: 'original' | 'painted' | 'replaced' | 'putty';
    onClick: () => void;
    icon: any;
  }) => {
    let colorClass = 'bg-gray-100 text-gray-400 border-gray-200';
    if (status === 'original') colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (status === 'painted') colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (status === 'replaced') colorClass = 'bg-red-500/10 text-red-600 border-red-500/20';

    return (
      <button
        onClick={onClick}
        disabled={readOnly}
        className={cn(
          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95",
          colorClass,
          readOnly && "cursor-default hover:scale-100"
        )}
      >
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", status === 'original' ? "bg-emerald-500/20" : status === 'painted' ? "bg-amber-500/20" : "bg-red-500/20")}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold">{label}</span>
      </button>
    );
  };

  const SpecField = ({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder,
    type = "text"
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    icon: any;
    placeholder: string;
    type?: string;
  }) => (
    <div className="group relative bg-background/50 hover:bg-background/80 transition-colors rounded-xl p-3 border border-border/40 hover:border-border/80">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
        <Icon className="w-3.5 h-3.5" />
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
  );

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
              <Button size="sm" onClick={handleSave} disabled={saving || readOnly} className="gap-2 bg-luxury hover:bg-luxury/90 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint} className="print:hidden">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* 1. Vehicle Identity (Top Left) */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-4 bg-card rounded-3xl p-6 border border-border/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-luxury/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Vehicle Identity</h2>
                    <p className="text-muted-foreground text-sm">Core details and specifications</p>
                  </div>
                  <div className="w-10 h-10 bg-luxury/10 rounded-xl flex items-center justify-center text-luxury">
                    <Car className="w-5 h-5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <SpecField label="Brand" value={carInfo.brand} onChange={(v) => setCarInfo({ ...carInfo, brand: v })} icon={Car} placeholder="Toyota" />
                  <SpecField label="Model" value={carInfo.model} onChange={(v) => setCarInfo({ ...carInfo, model: v })} icon={Info} placeholder="Camry" />
                  <SpecField label="Year" value={carInfo.year} onChange={(v) => setCarInfo({ ...carInfo, year: v })} icon={Calendar} placeholder="2024" />
                  <SpecField label="Mileage" value={carInfo.mileage} onChange={(v) => setCarInfo({ ...carInfo, mileage: v })} icon={Gauge} placeholder="0 km" />
                  <div className="col-span-2 sm:col-span-4">
                    <SpecField label="VIN Number" value={carInfo.vin} onChange={(v) => setCarInfo({ ...carInfo, vin: v })} icon={FileText} placeholder="17-Digit VIN" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Overall Scorecard (Top Right) */}
            <div className="md:col-span-4 bg-card rounded-3xl p-6 border border-border/50 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-luxury to-transparent opacity-20" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Overall Condition</h3>
                <Badge variant={overallCondition === 'excellent' ? 'default' : 'outline'} className="capitalize">
                  {overallCondition}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {(['excellent', 'good', 'fair', 'poor'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setOverallCondition(option)}
                    disabled={readOnly}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                      overallCondition === option
                        ? "bg-luxury text-white border-luxury shadow-md scale-105"
                        : "bg-background hover:bg-accent border-transparent hover:border-border text-muted-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inspection Date</span>
                  <span className="font-mono font-medium">{carInfo.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{carInfo.location || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 3. Main Visual Area (Middle) */}
            <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Panel: Mechanical Stats */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50 h-full">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-luxury" />
                    Mechanical
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    <StatusIndicator
                      label="Engine"
                      icon={Wrench}
                      status={'original'} // Placeholder logic - needs state
                      onClick={() => { }}
                    />
                    <StatusIndicator
                      label="Transmission"
                      icon={Cog}
                      status={'original'}
                      onClick={() => { }}
                    />
                    <StatusIndicator
                      label="Suspension"
                      icon={Disc}
                      status={'original'}
                      onClick={() => { }}
                    />
                    <StatusIndicator
                      label="Brakes"
                      icon={Disc}
                      status={'original'}
                      onClick={() => { }}
                    />
                  </div>
                </div>
              </div>

              {/* Center Panel: Car Diagram */}
              <div className="lg:col-span-6">
                <div className="bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl p-8 relative min-h-[600px] flex items-center justify-center overflow-hidden group">

                  {/* Background Elements */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury/5 via-transparent to-transparent opacity-50" />
                  <div className="absolute top-6 left-0 w-full text-center">
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground/40">Interactive Inspection Diagram</span>
                  </div>

                  {/* Legend Overlay */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-3 rounded-2xl border border-border/20 shadow-sm text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#EF4444]" /> Painted</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Replaced</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F97316]" /> Body Repair</div>
                  </div>

                  {/* The SVG */}
                  <div className="relative z-10 w-full max-w-[340px] transition-transform duration-500 group-hover:scale-[1.02]">
                    <svg viewBox="0 0 320 640" className="w-full h-auto drop-shadow-2xl" role="img" aria-label="Car Body Map">
                      <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Headlights */}
                      <path d="M 60 40 Q 80 30 100 40 L 100 55 L 60 55 Z" fill="#FDE047" className="opacity-80" />
                      <path d="M 220 40 Q 240 30 260 40 L 260 55 L 220 55 Z" fill="#FDE047" className="opacity-80" />

                      {/* Taillights */}
                      <path d="M 60 570 Q 80 580 100 570 L 100 555 L 60 555 Z" fill="#EF4444" className="opacity-80" />
                      <path d="M 220 570 Q 240 580 260 570 L 260 555 L 220 555 Z" fill="#EF4444" className="opacity-80" />

                      {/* Front Bumper */}
                      <path
                        d="M 50 60 Q 160 40 270 60 L 270 95 Q 160 105 50 95 Z"
                        fill={fillForStatus(bodyParts.frontBumper)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontBumper: cycleStatus(bodyParts.frontBumper) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Hood */}
                      <path
                        d="M 55 100 Q 160 110 265 100 L 250 210 Q 160 220 70 210 Z"
                        fill={fillForStatus(bodyParts.hood)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, hood: cycleStatus(bodyParts.hood) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Front Left Fender */}
                      <path
                        d="M 50 100 L 65 210 L 30 210 Q 30 150 50 100 Z"
                        fill={fillForStatus(bodyParts.frontLeftFender)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontLeftFender: cycleStatus(bodyParts.frontLeftFender) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Front Right Fender */}
                      <path
                        d="M 270 100 L 255 210 L 290 210 Q 290 150 270 100 Z"
                        fill={fillForStatus(bodyParts.frontRightFender)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontRightFender: cycleStatus(bodyParts.frontRightFender) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Windshield Area (Glass) */}
                      <path
                        d="M 70 215 Q 160 225 250 215 L 240 255 Q 160 265 80 255 Z"
                        fill="#e0f2fe"
                        stroke="#94a3b8"
                        strokeWidth="1"
                        className="opacity-50"
                      />

                      {/* Roof */}
                      <path
                        d="M 80 260 Q 160 270 240 260 L 240 380 Q 160 390 80 380 Z"
                        fill={fillForStatus(bodyParts.roof)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, roof: cycleStatus(bodyParts.roof) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Front Left Door */}
                      <path
                        d="M 30 215 L 75 260 L 75 380 L 30 380 Z"
                        fill={fillForStatus(bodyParts.frontLeftDoor)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontLeftDoor: cycleStatus(bodyParts.frontLeftDoor) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Front Right Door */}
                      <path
                        d="M 290 215 L 245 260 L 245 380 L 290 380 Z"
                        fill={fillForStatus(bodyParts.frontRightDoor)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, frontRightDoor: cycleStatus(bodyParts.frontRightDoor) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Rear Left Door */}
                      <path
                        d="M 30 385 L 75 385 L 75 460 L 30 440 Z"
                        fill={fillForStatus(bodyParts.rearLeftDoor)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearLeftDoor: cycleStatus(bodyParts.rearLeftDoor) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Rear Right Door */}
                      <path
                        d="M 290 385 L 245 385 L 245 460 L 290 440 Z"
                        fill={fillForStatus(bodyParts.rearRightDoor)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearRightDoor: cycleStatus(bodyParts.rearRightDoor) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Rear Window Area (Glass) */}
                      <path
                        d="M 80 385 Q 160 395 240 385 L 250 420 Q 160 430 70 420 Z"
                        fill="#e0f2fe"
                        stroke="#94a3b8"
                        strokeWidth="1"
                        className="opacity-50"
                      />

                      {/* Trunk */}
                      <path
                        d="M 70 425 Q 160 435 250 425 L 260 510 Q 160 520 60 510 Z"
                        fill={fillForStatus(bodyParts.trunk)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, trunk: cycleStatus(bodyParts.trunk) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Rear Left Fender */}
                      <path
                        d="M 30 445 L 65 510 L 50 510 Q 30 480 30 445 Z"
                        fill={fillForStatus(bodyParts.rearLeftFender)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearLeftFender: cycleStatus(bodyParts.rearLeftFender) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Rear Right Fender */}
                      <path
                        d="M 290 445 L 255 510 L 270 510 Q 290 480 290 445 Z"
                        fill={fillForStatus(bodyParts.rearRightFender)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearRightFender: cycleStatus(bodyParts.rearRightFender) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {/* Rear Bumper */}
                      <path
                        d="M 50 515 Q 160 525 270 515 L 270 555 Q 160 570 50 555 Z"
                        fill={fillForStatus(bodyParts.rearBumper)}
                        stroke="#475569"
                        strokeWidth="1.5"
                        onClick={() => !readOnly && setBodyParts({ ...bodyParts, rearBumper: cycleStatus(bodyParts.rearBumper) })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      <text x="160" y="600" textAnchor="middle" fontSize="12" fill="#94a3b8" className="font-mono uppercase tracking-widest">
                        Rear
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Panel: Summary & Issues */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50 h-full flex flex-col">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-luxury" />
                    Report Summary
                  </h3>

                  <div className="flex-1 space-y-4">
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

                    <Separator />

                    {/* Comments Input */}
                    <div className="flex-1">
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

            {/* 4. Bottom Row: Photos */}
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
                    <button className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-luxury/50 hover:bg-luxury/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-luxury">
                      <Camera className="w-6 h-6" />
                      <span className="text-xs font-medium">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CarInspectionReport;
