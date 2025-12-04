import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const statusToCondition = (status: BodyStatus) => {
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

  const StatusButton = ({
    value,
    current,
    onClick,
    label,
    icon: Icon,
    disabled,
  }: {
    value: BodyStatus;
    current: BodyStatus;
    onClick: (v: BodyStatus) => void;
    label: string;
    icon: any;
    disabled?: boolean;
  }) => (
    <Button
      variant={current === value ? 'default' : 'outline'}
      size="sm"
      onClick={() => onClick(value)}
      disabled={disabled}
      className={cn(
        'gap-2 transition-all duration-200 flex-1',
        current === value && value === 'good' && 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
        current === value && value === 'warning' && 'bg-amber-600 hover:bg-amber-700 border-amber-600',
        current === value && value === 'bad' && 'bg-red-600 hover:bg-red-700 border-red-600',
        current !== value && 'hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );

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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={isAdmin ? 'default' : 'outline'}>{isAdmin ? 'Admin' : 'User'}</Badge>
              <Badge variant={isWhitelisted ? 'secondary' : 'outline'}>
                {isWhitelisted ? 'Whitelisted' : 'Not whitelisted'}
              </Badge>
              <Badge variant={readOnly ? 'outline' : 'default'}>{readOnly ? 'Read only' : 'Editable'}</Badge>
              {currentReportId && <Badge variant="outline">Report ID: {currentReportId}</Badge>}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Load report by ID"
                value={currentReportId || ''}
                onChange={(e) => setCurrentReportId(e.target.value || undefined)}
                className="max-w-md"
              />
              <Button onClick={() => loadReport(currentReportId)} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
              </Button>
              <Button onClick={handleSave} disabled={saving || readOnly} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save report
              </Button>
            </div>
            {!canEdit && (
              <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Read-only mode: only admins or whitelisted authors can edit.
              </div>
            )}
          </div>

          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 md:p-10 shadow-xl print:shadow-none print:border print:border-gray-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-luxury/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-luxury/10 rounded-2xl flex items-center justify-center text-luxury shadow-sm border border-luxury/20">
                  <Car className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                    Vehicle Inspection Report
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground font-mono text-sm">
                    <Calendar className="w-4 h-4" />
                    <Input
                      type="date"
                      value={carInfo.date}
                      onChange={(e) => setCarInfo({ ...carInfo, date: e.target.value })}
                      disabled={readOnly}
                      className="h-8 w-auto bg-transparent border-none p-0"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="print:hidden gap-2 hover:bg-luxury hover:text-luxury-foreground transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Car Info */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Info className="w-5 h-5 text-luxury" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input
                      placeholder="e.g. Toyota"
                      value={carInfo.brand}
                      onChange={(e) => setCarInfo({ ...carInfo, brand: e.target.value })}
                      className="bg-background/50"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      placeholder="e.g. Camry"
                      value={carInfo.model}
                      onChange={(e) => setCarInfo({ ...carInfo, model: e.target.value })}
                      className="bg-background/50"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        placeholder="e.g. 2023"
                        value={carInfo.year}
                        onChange={(e) => setCarInfo({ ...carInfo, year: e.target.value })}
                        className="bg-background/50"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mileage (km)</Label>
                      <Input
                        placeholder="e.g. 50,000"
                        value={carInfo.mileage}
                        onChange={(e) => setCarInfo({ ...carInfo, mileage: e.target.value })}
                        className="bg-background/50"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>VIN</Label>
                    <Input
                      placeholder="Vehicle Identification Number"
                      value={carInfo.vin}
                      onChange={(e) => setCarInfo({ ...carInfo, vin: e.target.value })}
                      className="bg-background/50 font-mono uppercase"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="City / site"
                      value={carInfo.location}
                      onChange={(e) => setCarInfo({ ...carInfo, location: e.target.value })}
                      className="bg-background/50"
                      disabled={readOnly}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Engine & Drivetrain */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Gauge className="w-5 h-5 text-luxury" />
                    Mechanical & Systems
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'engine', label: 'Engine', icon: Wrench },
                    { key: 'gearbox', label: 'Transmission', icon: Cog },
                    { key: 'suspension', label: 'Suspension', icon: Disc },
                    { key: 'verdict', label: 'Overall verdict', icon: Check },
                  ].map((item) => (
                    <div key={item.key} className="flex flex-col gap-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </Label>
                      <div className="flex gap-2">
                        <StatusButton
                          value="original"
                          current={'original'}
                          onClick={() => null}
                          label="Good"
                          icon={Check}
                          disabled
                        />
                        <StatusButton value="painted" current={'painted'} onClick={() => null} label="Warning" icon={AlertTriangle} disabled />
                        <StatusButton value="replaced" current={'replaced'} onClick={() => null} label="Bad" icon={X} disabled />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Body & Paint */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="w-5 h-5 text-luxury" />
                    Body & Paint
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Structured Summary */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PAINTED PARTS
                    </h4>
                    {Object.values(bodyParts).every((s) => s === 'original') ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-500">Clean Title</p>
                          <p className="text-xs text-muted-foreground">All body parts are original</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(bodyParts)
                          .filter(([_, status]) => status !== 'original')
                          .map(([part, status]) => {
                            let badgeColorClass = '';
                            if (status === 'painted') badgeColorClass = 'border-red-500 text-red-500 bg-red-500/10';
                            else if (status === 'replaced')
                              badgeColorClass = 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
                            else if (status === 'putty')
                              badgeColorClass = 'border-orange-500 text-orange-500 bg-orange-500/10';

                            return (
                              <Badge
                                key={part}
                                variant="outline"
                                className={cn('capitalize px-3 py-1', badgeColorClass)}
                              >
                                {part.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls & Legend */}
                    <div className="lg:col-span-1 space-y-8">
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Overall Condition</Label>
                        <div className="flex flex-wrap gap-2">
                          {(['excellent', 'good', 'fair', 'poor', 'salvage'] as const).map((option) => (
                            <Button
                              key={option}
                              variant={overallCondition === option ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOverallCondition(option)}
                              disabled={readOnly}
                              className={cn(
                                'capitalize flex-1',
                                overallCondition === option && 'bg-luxury hover:bg-luxury/90'
                              )}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Legend</Label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-3 text-sm p-3 rounded-lg border bg-background/50">
                            <div className="w-6 h-6 rounded-md border bg-gray-100 shadow-sm" />
                            <span className="font-medium">Original</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm p-3 rounded-lg border bg-background/50">
                            <div className="w-6 h-6 rounded-md bg-[#EF4444] shadow-sm" />
                            <span className="font-medium">Painted</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm p-3 rounded-lg border bg-background/50">
                            <div className="w-6 h-6 rounded-md bg-[#F59E0B] shadow-sm" />
                            <span className="font-medium">Replaced</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm p-3 rounded-lg border bg-background/50">
                            <div className="w-6 h-6 rounded-md bg-[#F97316] shadow-sm" />
                            <span className="font-medium">Body Repair</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Click on the car parts in the diagram to cycle through statuses.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Car Diagram */}
                    <div className="lg:col-span-2 flex justify-center bg-muted/10 rounded-2xl p-8 border border-border/30 relative min-h-[500px] items-center">
                      <div className="absolute top-4 left-4 text-xs text-muted-foreground font-mono tracking-widest opacity-50">
                        INTERACTIVE DIAGRAM
                      </div>

                      {/* Front Indicator */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                        <span className="text-xs font-mono text-muted-foreground uppercase">Front</span>
                      </div>

                      <div className="w-full max-w-[320px] relative filter drop-shadow-2xl transition-all duration-500 hover:drop-shadow-3xl">
                        <svg viewBox="0 0 320 640" className="w-full h-auto" role="img" aria-label="Car Body Map">
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
                </CardContent>
              </Card>

              {/* Comments */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="w-5 h-5 text-luxury" />
                    Summary / Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Overall summary, defects, recommendations..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    className="bg-background/50"
                    disabled={readOnly}
                  />
                  <div className="text-xs text-muted-foreground">
                    This will be stored in the report summary (JSON payload) together with vehicle basics.
                  </div>
                </CardContent>
              </Card>

              {/* Photos */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Camera className="w-5 h-5 text-luxury" />
                    Photos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 border rounded-md p-3">
                      <div className="space-y-2">
                        <Label>URL / storage path</Label>
                        <Input
                          value={photo.storage_path}
                          onChange={(e) => {
                            const next = [...photos];
                            next[idx].storage_path = e.target.value;
                            setPhotos(next);
                          }}
                          disabled={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={photo.label || ''}
                          onChange={(e) => {
                            const next = [...photos];
                            next[idx].label = e.target.value;
                            setPhotos(next);
                          }}
                          disabled={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body part key (optional)</Label>
                        <Input
                          value={photo.body_part_key || ''}
                          onChange={(e) => {
                            const next = [...photos];
                            next[idx].body_part_key = e.target.value || null;
                            setPhotos(next);
                          }}
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  ))}
                  {!photos.length && <p className="text-sm text-muted-foreground">No photos attached.</p>}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPhotos([
                          ...photos,
                          { storage_path: '', label: '', body_part_key: null, sort_order: photos.length },
                        ])
                      }
                      disabled={readOnly}
                    >
                      Add photo
                    </Button>
                    {photos.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhotos(photos.slice(0, -1))}
                        disabled={readOnly}
                      >
                        Remove last
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload images to your preferred storage and paste the URL/path here. RLS allows read for everyone,
                    write only for admin/whitelisted authors.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Info className="w-5 h-5 text-luxury" />
                    Inspector
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      placeholder="Inspector name"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact email</Label>
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact phone</Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+9715xxxxxxx"
                      disabled={readOnly}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These details are saved in `report_authors` for your user. Whitelisted users can write; others stay read-only.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Check className="w-5 h-5 text-luxury" />
                    Quick status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall</span>
                    <Badge variant="default" className="uppercase">
                      {overallCondition}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <Badge variant={readOnly ? 'outline' : 'default'}>{readOnly ? 'Read only' : 'Editable'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Whitelisted</span>
                    <Badge variant={isWhitelisted ? 'secondary' : 'outline'}>
                      {isWhitelisted ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admin</span>
                    <Badge variant={isAdmin ? 'default' : 'outline'}>{isAdmin ? 'Yes' : 'No'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CarInspectionReport;
