import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { TooltipProvider } from '@/components/ui/tooltip';
import {
  TireDetails,
  TiresStatus,
  DEFAULT_TIRE_DETAILS,
  DEFAULT_TIRES_STATUS,
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
import { MechanicalStatus, DEFAULT_CHECKLISTS } from './MechanicalChecklistModal';
import { InteriorStatus, DEFAULT_INTERIOR_STATUS } from './InteriorChecklist';
import { ServiceRecord } from '@/types/inspection';
import { useLocalDraft } from '@/hooks/useLocalDraft';

// Import all extracted components
import {
  InspectionHeader,
  PhotoGallerySection,
  VehicleIdentityCard,
  BodyConditionSection,
  OverallConditionCard,
  KeyFindingsSection,
  MechanicalSection,
  TireSection,
  InteriorSection,
  SummarySection,
  RecommendationsSection,
  ServiceHistorySection,
  InspectionToolbar,
  PublishShareSection,
  VideoWalkthroughSection,
  calculateHealthScore,
  type CarInfo,
  type BodyStatus,
  type LinkedListing,
} from '@/features/inspection/components';

type Props = {
  reportId?: string;
  readOnly?: boolean;
  initialData?: any;
};



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
  { key: 'frontLeftDoor', label: 'Front L Door' },
  { key: 'frontRightDoor', label: 'Front R Door' },
  { key: 'rearLeftDoor', label: 'Rear L Door' },
  { key: 'rearRightDoor', label: 'Rear R Door' },
];



const statusToCondition = (
  status?: BodyStatus
): { condition: ReportBodyPartInput['condition']; severity: number } => {
  const normalized = status ?? 'original';
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

// Encode/decode helpers
const encodeSummary = (
  carInfo: CarInfo,
  summary: string,
  recommendations: string,
  serviceHistory: ServiceRecord[],
  mechanicalStatus: MechanicalStatus,
  tiresStatus: TiresStatus,
  interiorStatus: InteriorStatus,
  videoUrl?: string,
) => {
  const payload = {
    schemaVersion: 1,
    carInfo,
    summary,
    recommendations,
    serviceHistory,
    mechanicalStatus,
    tiresStatus,
    interiorStatus,
    videoUrl,
  };
  return JSON.stringify(payload);
};

const decodeSummary = (str: string | null) => {
  if (!str) return null;
  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (e) {
    return null;
  }
};

type InitialSummaryData = {
  summaryText: string;
  recommendationsText: string;
  serviceHistory: ServiceRecord[];
  mechanicalStatus: MechanicalStatus;
  tiresStatus: TiresStatus;
  interiorStatus: InteriorStatus;
  videoUrl: string;
  carInfoPatch: Partial<CarInfo>;
};

const parseInitialSummaryData = (initialData?: any): InitialSummaryData => {
  if (!initialData) {
    return {
      summaryText: '',
      recommendationsText: '',
      serviceHistory: [],
      mechanicalStatus: {},
      tiresStatus: DEFAULT_TIRES_STATUS,
      interiorStatus: DEFAULT_INTERIOR_STATUS,
      videoUrl: '',
      carInfoPatch: {},
    };
  }

  const rawSummary = initialData.summary;
  const decodedSummary =
    typeof rawSummary === 'string'
      ? decodeSummary(rawSummary)
      : typeof rawSummary === 'object' && rawSummary !== null
        ? rawSummary
        : null;

  const summaryText =
    decodedSummary?.summary ??
    decodedSummary?.comment ??
    initialData.notes ??
    (typeof rawSummary === 'string' ? rawSummary : '') ??
    '';

  return {
    summaryText,
    recommendationsText: decodedSummary?.recommendations || '',
    serviceHistory:
      (Array.isArray(initialData.service_history) && initialData.service_history) ||
      (Array.isArray(decodedSummary?.serviceHistory) && decodedSummary.serviceHistory) ||
      [],
    mechanicalStatus: initialData.mechanical_checklist || decodedSummary?.mechanicalStatus || {},
    tiresStatus: initialData.tires_status || decodedSummary?.tiresStatus || DEFAULT_TIRES_STATUS,
    interiorStatus: initialData.interior_status || decodedSummary?.interiorStatus || DEFAULT_INTERIOR_STATUS,
    videoUrl: decodedSummary?.videoUrl || '',
    carInfoPatch: decodedSummary?.carInfo || {},
  };
};

const CarInspectionReport: React.FC<Props> = ({ reportId, readOnly: forceReadOnly, initialData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const initialSummaryData = useMemo(() => parseInitialSummaryData(initialData), [initialData]);

  // Detect print mode from URL param
  const isPrintMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('print') === 'true';
  }, []);

  // Core State
  const [currentReportId, setCurrentReportId] = useState<string | undefined>(
    initialData?.id || reportId
  );
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);

  // Permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [authorUserId, setAuthorUserId] = useState<string | null>(
    initialData?.author?.user_id || null
  );



  // Report Content State
  const [inspectorName, setInspectorName] = useState(initialData?.author?.full_name || '');
  const [contactEmail, setContactEmail] = useState(initialData?.author?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initialData?.author?.contact_phone || '');

  const [carInfo, setCarInfo] = useState<CarInfo>({
    brand: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year ? String(initialData.year) : new Date().getFullYear().toString(),
    mileage: initialData?.odometer_km ? String(initialData.odometer_km) : '',
    vin: initialData?.vin || '',
    location: initialData?.location || '',
    date: initialData?.inspection_date || new Date().toISOString().slice(0, 10),
    owners: initialData?.number_of_owners ? String(initialData.number_of_owners) : '',
    mulkiaExpiry: initialData?.mulkia_expiry || '',
    accidentHistory: initialData?.accident_history || 'not_reported',
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
    ...initialSummaryData.carInfoPatch,
  });

  const [overallCondition, setOverallCondition] = useState<
    'excellent' | 'good' | 'fair' | 'poor' | 'salvage'
  >(initialData?.overall_condition || 'fair');
  const [summary, setSummary] = useState(initialSummaryData.summaryText);
  const [recommendations, setRecommendations] = useState(initialSummaryData.recommendationsText);
  const [videoUrl, setVideoUrl] = useState(initialSummaryData.videoUrl);

  const [bodyParts, setBodyParts] = useState<Record<string, BodyStatus>>(() => {
    const initial: Record<string, BodyStatus> = {};
    bodyPartKeys.forEach((part) => {
      initial[part.key] = 'original';
    });
    if (initialData?.body_parts) {
      initialData.body_parts.forEach((part: any) => {
        const status = conditionToStatus(part.condition);
        initial[part.part] = status;
      });
    }
    return initial;
  });

  const [mechanicalStatus, setMechanicalStatus] = useState<MechanicalStatus>(
    initialSummaryData.mechanicalStatus
  );

  const [tiresStatus, setTiresStatus] = useState<TiresStatus>(
    initialSummaryData.tiresStatus
  );

  const [interiorStatus, setInteriorStatus] = useState<InteriorStatus>(
    initialSummaryData.interiorStatus
  );




  const [photos, setPhotos] = useState<
    { storage_path: string; label?: string; body_part_key?: string | null; sort_order?: number }[]
  >(initialData?.photos || []);

  const healthScore = useMemo(() => {
    return calculateHealthScore(mechanicalStatus, bodyParts, tiresStatus, interiorStatus);
  }, [mechanicalStatus, bodyParts, tiresStatus, interiorStatus]);

  const keyFindings = useMemo(() => {
    const findings: { level: 'critical' | 'issue' | 'info'; text: string }[] = [];

    // Mechanical findings
    Object.entries(mechanicalStatus || {}).forEach(([key, category]) => {
      const status = category?.status;
      if (status === 'issue' || status === 'critical') {
        const label = DEFAULT_CHECKLISTS[key]?.label || key;
        const issueCount =
          category?.items?.filter((i) => i.condition !== 'ok' && i.condition !== 'na').length || 0;
        findings.push({
          level: status === 'critical' ? 'critical' : 'issue',
          text:
            issueCount > 0
              ? `${label}: ${issueCount} issue${issueCount === 1 ? '' : 's'}`
              : `${label}: ${status}`,
        });
      }
    });

    // Body findings
    const bodyIssues = Object.entries(bodyParts).filter(
      ([_, s]) => s !== 'original' && s !== 'ppf'
    );
    if (bodyIssues.length > 0) {
      const major = bodyIssues.filter(([, s]) => s === 'putty' || s === 'replaced').length;
      findings.push({
        level: major > 0 ? 'issue' : 'info',
        text:
          major > 0
            ? `${bodyIssues.length} body panels repaired/painted (${major} major)`
            : `${bodyIssues.length} body panels painted/repaired`,
      });
    }

    // Tire findings (main 4)
    const tireKeys: (keyof TiresStatus)[] = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
    const tireCounts = { fair: 0, poor: 0, replace: 0 };
    tireKeys.forEach((k) => {
      const condition = tiresStatus?.[k]?.condition;
      if (condition && condition !== 'good') {
        if (condition === 'fair') tireCounts.fair += 1;
        if (condition === 'poor') tireCounts.poor += 1;
        if (condition === 'replace') tireCounts.replace += 1;
      }
    });
    const totalTireIssues = tireCounts.fair + tireCounts.poor + tireCounts.replace;
    if (totalTireIssues > 0) {
      const parts: string[] = [];
      if (tireCounts.replace) parts.push(`${tireCounts.replace} need replacement`);
      if (tireCounts.poor) parts.push(`${tireCounts.poor} poor`);
      if (tireCounts.fair) parts.push(`${tireCounts.fair} fair`);
      findings.push({
        level: tireCounts.replace > 0 ? 'issue' : 'info',
        text: `Tires: ${parts.join(', ')}`,
      });
    }

    // Interior findings
    const interiorKeys = [
      'seats',
      'dashboard',
      'headliner',
      'carpets',
      'doorPanels',
      'controls',
    ] as const;
    const interiorWearCount = interiorKeys.filter(
      (k) => interiorStatus?.[k] && interiorStatus[k] !== 'good'
    ).length;
    const odor = interiorStatus?.odor;
    const odorIsIssue = odor && ['smoke', 'mold', 'other'].includes(odor);
    if (interiorWearCount > 0 || odorIsIssue) {
      const parts: string[] = [];
      if (interiorWearCount > 0) parts.push(`${interiorWearCount} areas with wear`);
      if (odorIsIssue) parts.push(`odor: ${odor}`);
      findings.push({
        level: odorIsIssue ? 'issue' : 'info',
        text: `Interior: ${parts.join(', ')}`,
      });
    }

    const order = { critical: 0, issue: 1, info: 2 } as const;
    findings.sort((a, b) => order[a.level] - order[b.level]);

    return findings.slice(0, 6);
  }, [mechanicalStatus, bodyParts, tiresStatus, interiorStatus]);

  // Report status and linking
  const [reportStatus, setReportStatus] = useState<ReportStatus>(initialData?.status || 'draft');
  const [shareSlug, setShareSlug] = useState<string | null>(initialData?.share_slug || null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    initialData?.listing?.id || null
  );

  const publicReportUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (shareSlug) return `${window.location.origin}/report/${shareSlug}`;
    const url = new URL(window.location.href);
    url.searchParams.delete('print');
    url.searchParams.delete('pdf');
    return url.toString();
  }, [shareSlug]);

  const publicReportQrUrl = useMemo(() => {
    if (!publicReportUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
      publicReportUrl
    )}`;
  }, [publicReportUrl]);

  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>(
    initialSummaryData.serviceHistory
  );
  const [availableListings, setAvailableListings] = useState<
    Array<{ id: string; title: string; make: string; model: string; year: number; vin?: string }>
  >([]);

  const [linkedListing, setLinkedListing] = useState<LinkedListing | null>(
    initialData?.listing || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportDisplayId, setReportDisplayId] = useState<string>(initialData?.display_id || '');



  // Computed read-only state
  const canEdit = useMemo(() => {
    if (forceReadOnly) return false;
    if (reportStatus === 'frozen' && !isAdmin) return false;
    if (isAdmin) return true;
    if (!user?.id) return false;
    if (!isWhitelisted) return false;
    if (!currentReportId) return true;
    return authorUserId === user.id;
  }, [authorUserId, currentReportId, isAdmin, isWhitelisted, user?.id, reportStatus, forceReadOnly]);

  const readOnly = !canEdit;

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

      setReportStatus(data.status || 'draft');
      setShareSlug(data.share_slug || null);
      setReportDisplayId(data.display_id || '');

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

      // Debug logging
      console.log('🔍 Loading report data:', {
        rawSummary: data.summary?.substring(0, 100) + '...',
        decoded: decoded,
        summaryLength: decoded?.summary?.length || 0,
        serviceHistoryCount: decoded?.serviceHistory?.length || 0,
        hasMechanical: !!decoded?.mechanicalStatus,
        hasTires: !!decoded?.tiresStatus,
        hasInterior: !!decoded?.interiorStatus,
      });

      if (decoded) {
        setCarInfo((prev) => ({ ...prev, ...decoded.carInfo }));
        setCarInfo((prev) => ({ ...prev, ...decoded.carInfo }));
        setSummary(decoded.summary || '');
        setVideoUrl(decoded.videoUrl || '');
        setServiceHistory(decoded.serviceHistory || []);

        // Restore mechanical, tires, and interior status
        if (decoded.mechanicalStatus) {
          setMechanicalStatus(decoded.mechanicalStatus);
        }
        if (decoded.tiresStatus) {
          setTiresStatus(decoded.tiresStatus);
        }
        if (decoded.interiorStatus) {
          setInteriorStatus(decoded.interiorStatus);
        }
      } else {
        setSummary(data.summary || '');
      }

      if (data.body_parts) {
        const bodyPartsMap: Record<string, BodyStatus> = {};
        bodyPartKeys.forEach((part) => {
          bodyPartsMap[part.key] = 'original';
        });
        data.body_parts.forEach((part: any) => {
          const status = conditionToStatus(part.condition, part.notes);
          bodyPartsMap[part.part] = status;
        });
        setBodyParts(bodyPartsMap);
      }

      if (data.mechanical_checklist) {
        setMechanicalStatus(data.mechanical_checklist);
      }
      if (data.tires_status) {
        setTiresStatus(data.tires_status);
      }
      if (data.interior_status) {
        setInteriorStatus(data.interior_status);
      }
      if (Array.isArray((data as any).service_history)) {
        setServiceHistory((data as any).service_history);
      }
      setPhotos(data.photos || []);

      toast({ title: 'Report loaded', description: `ID: ${data.display_id || data.id.slice(0, 8)}` });
    } catch (err: any) {
      toast({ title: 'Error loading report', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Load report on mount or when reportId changes
  useEffect(() => {
    if (!initialData && reportId) {
      loadReport(reportId);
    } else if (!initialData && !reportId) {
      // No data to load, set loading to false
      setLoading(false);
    }
  }, [reportId]);

  // Check permissions
  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      setIsWhitelisted(false);
      return;
    }

    const checkPerms = async () => {
      const adminStatus = await hasAdminRole(user.id);
      setIsAdmin(adminStatus);

      const whitelisted = await isWhitelistedReportAuthor(user.id);
      setIsWhitelisted(whitelisted);
    };

    checkPerms();
  }, [user?.id]);

  // Load available listings
  useEffect(() => {
    if (!user?.id) return;
    const loadListings = async () => {
      try {
        const listings = await getAvailableListingsForReport();
        setAvailableListings(listings);
      } catch (err) {
        console.error('Error loading listings:', err);
      }
    };
    loadListings();
  }, [user?.id]);

  // ===== AUTO-SAVE DRAFT FUNCTIONALITY =====
  const { loadDraft, saveDraft, clearDraft, clearNewReportDraft } = useLocalDraft(currentReportId);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft on mount (only for new reports or if no initialData)
  useEffect(() => {
    if (draftLoaded || initialData || reportId) return;

    const draft = loadDraft();
    if (draft) {
      // Restore all state from draft
      setCarInfo(draft.carInfo);
      setOverallCondition(draft.overallCondition as any);
      setSummary(draft.summary);
      setRecommendations(draft.recommendations || '');
      setVideoUrl(draft.videoUrl || '');
      setBodyParts(draft.bodyParts as Record<string, BodyStatus>);
      setMechanicalStatus(draft.mechanicalStatus);
      setTiresStatus(draft.tiresStatus);
      setInteriorStatus(draft.interiorStatus);
      setServiceHistory(draft.serviceHistory || []);
      setInspectorName(draft.inspectorName || '');
      setContactEmail(draft.contactEmail || '');
      setContactPhone(draft.contactPhone || '');

      toast({
        title: 'Draft restored',
        description: 'Your previous unsaved work has been restored.',
      });
    }
    setDraftLoaded(true);
  }, [draftLoaded, initialData, reportId, loadDraft, toast]);

  // Auto-save draft when any form data changes (debounced inside hook)
  const saveDraftCallback = useCallback(() => {
    // Don't save drafts for existing reports with data from server
    if (initialData || reportId) return;

    saveDraft({
      carInfo,
      overallCondition,
      summary,
      recommendations,
      videoUrl,
      bodyParts,
      mechanicalStatus,
      tiresStatus,
      interiorStatus,
      serviceHistory,
      inspectorName,
      contactEmail,
      contactPhone,
    });
  }, [
    carInfo, overallCondition, summary, videoUrl, bodyParts, mechanicalStatus,
    recommendations, tiresStatus, interiorStatus, serviceHistory, inspectorName,
    contactEmail, contactPhone, saveDraft, initialData, reportId
  ]);

  useEffect(() => {
    if (!draftLoaded) return; // Don't save during initial load
    saveDraftCallback();
  }, [saveDraftCallback, draftLoaded]);

  // Clear draft when report is successfully saved to database
  const clearDraftOnSave = useCallback(() => {
    clearDraft();
    clearNewReportDraft();
  }, [clearDraft, clearNewReportDraft]);

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'Must be logged in to save', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let authorId = authorUserId;
      if (!authorId) {
        const ensuredAuthorId = await ensureAuthorForUser(user.id, {
          full_name: inspectorName,
          contact_email: contactEmail,
          contact_phone: contactPhone
        });
        if (!ensuredAuthorId) throw new Error('Could not create author record');
        authorId = ensuredAuthorId;
        setAuthorUserId(ensuredAuthorId);
      }

      const bodyPartsArray = Object.keys(bodyParts).map((key) => {
        const { condition, severity } = statusToCondition(bodyParts[key]);
        return {
          part: key,
          condition,
          severity,
          notes: bodyParts[key] === 'ppf' ? 'PPF' : null,
        };
      });

      const summaryEncoded = encodeSummary(
        carInfo,
        summary,
        recommendations,
        serviceHistory,
        mechanicalStatus,
        tiresStatus,
        interiorStatus,
        videoUrl
      );

      // Debug logging
      console.log('🔍 Saving report data:', {
        summary: summary?.substring(0, 100) + '...',
        serviceHistoryCount: serviceHistory?.length || 0,
        mechanicalStatus: Object.keys(mechanicalStatus || {}).length,
        tiresStatus: Object.keys(tiresStatus || {}).length,
        interiorStatus: Object.keys(interiorStatus || {}).length,
      });

      const result = await saveReport({
        id: currentReportId,
        author_id: authorId,
        vin: carInfo.vin,
        inspection_date: carInfo.date,
        overall_condition: overallCondition,
        odometer_km: parseInt(carInfo.mileage) || null,
        summary: summaryEncoded,
      }, bodyPartsArray, photos);

      if (!currentReportId) {
        setCurrentReportId(result.id);
        setReportDisplayId(result.display_id);
      }

      await logReportAction('save', result.id, { message: 'Updated report data' });

      // Clear localStorage draft after successful save
      clearDraftOnSave();

      toast({ title: 'Saved', description: 'Report saved successfully' });
    } catch (err: any) {
      toast({ title: 'Error saving report', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    console.log('handlePhotoUpload called:', { files: files?.length, canEdit, readOnly });

    if (!files) {
      console.log('handlePhotoUpload: No files provided');
      return;
    }

    if (!canEdit) {
      console.log('handlePhotoUpload: Cannot edit - user not authorized');
      toast({
        title: 'Cannot upload photos',
        description: 'You do not have permission to edit this report',
        variant: 'destructive'
      });
      return;
    }

    const fileArray = Array.from(files);
    console.log('handlePhotoUpload: Uploading', fileArray.length, 'files');
    setSaving(true);

    try {
      for (const file of fileArray) {
        console.log('handlePhotoUpload: Uploading file:', file.name);
        const url = await uploadReportPhoto(file);
        console.log('handlePhotoUpload: File uploaded, URL:', url);
        setPhotos((prev) => {
          const newPhotos = [...prev, { storage_path: url, label: file.name }];
          console.log('handlePhotoUpload: Photos state updated, count:', newPhotos.length);
          return newPhotos;
        });
      }
      toast({ title: 'Photos uploaded', description: `${fileArray.length} photo(s) added` });
    } catch (err: any) {
      console.error('handlePhotoUpload: Error uploading:', err);
      toast({ title: 'Error uploading photos', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all fields to default?')) {
      setCarInfo({
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        mileage: '',
        vin: '',
        location: '',
        date: new Date().toISOString().slice(0, 10),
        owners: '',
        mulkiaExpiry: '',
        accidentHistory: 'not_reported',
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
      setSummary('');
      setRecommendations('');
      setVideoUrl('');
      setBodyParts(
        bodyPartKeys.reduce(
          (acc, part) => {
            acc[part.key] = 'original';
            return acc;
          },
          {} as Record<string, BodyStatus>
        )
      );
      setMechanicalStatus({});
      setTiresStatus(DEFAULT_TIRES_STATUS);
      setInteriorStatus(DEFAULT_INTERIOR_STATUS);
      setPhotos([]);
      setServiceHistory([]);

      // Clear localStorage draft when resetting form
      clearDraftOnSave();
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Report URL copied to clipboard.' });
  };

  const handleGenerateReport = async () => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'Must be logged in', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setSaving(true);

    try {
      // Step 1: Save the report first
      let reportId = currentReportId;

      // Always save before generating (create or update)
      let authorId = authorUserId;
      if (!authorId) {
        const ensuredAuthorId = await ensureAuthorForUser(user.id, {
          full_name: inspectorName,
          contact_email: contactEmail,
          contact_phone: contactPhone
        });
        if (!ensuredAuthorId) throw new Error('Could not create author record');
        authorId = ensuredAuthorId;
        setAuthorUserId(ensuredAuthorId);
      }

      const bodyPartsArray = Object.keys(bodyParts).map((key) => {
        const { condition, severity } = statusToCondition(bodyParts[key]);
        return {
          part: key,
          condition,
          severity,
          notes: bodyParts[key] === 'ppf' ? 'PPF' : null,
        };
      });

      const summaryEncoded = encodeSummary(
        carInfo,
        summary,
        recommendations,
        serviceHistory,
        mechanicalStatus,
        tiresStatus,
        interiorStatus,
        videoUrl
      );

      const saveResult = await saveReport({
        id: currentReportId,
        author_id: authorId,
        vin: carInfo.vin,
        inspection_date: carInfo.date,
        overall_condition: overallCondition,
        odometer_km: parseInt(carInfo.mileage) || null,
        summary: summaryEncoded,
      }, bodyPartsArray, photos);

      if (!currentReportId) {
        reportId = saveResult.id;
        setCurrentReportId(saveResult.id);
        setReportDisplayId(saveResult.display_id);
      }

      if (!reportId) throw new Error('Failed to obtain Report ID');

      await logReportAction('save', reportId, { message: 'Saved before publishing' });
      clearDraftOnSave();
      setSaving(false);

      // Step 2: Generate (freeze) the report
      const freezeResult = await freezeReport(reportId);
      setReportStatus(freezeResult.status);
      setShareSlug(freezeResult.share_slug);

      if (selectedListingId && selectedListingId !== 'none' && !linkedListing) {
        await linkReportToListing(reportId, selectedListingId);
        const listing = await getLinkedListing(reportId);
        if (listing) setLinkedListing(listing);
      }

      await logReportAction('publish', reportId, { message: 'Report published (frozen)' });
      toast({
        title: 'Success',
        description: 'Report saved and published successfully'
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setSaving(false);
    }
  };

  const handleUnfreezeReport = async () => {
    if (!currentReportId || !isAdmin) return;

    try {
      await unfreezeReport(currentReportId);
      setReportStatus('draft');
      toast({ title: 'Unlocked', description: 'Report is now editable' });
    } catch (err: any) {
      toast({ title: 'Error unlocking report', description: err.message, variant: 'destructive' });
    }
  };

  const handleListingChange = async (listingId: string) => {
    setSelectedListingId(listingId === 'none' ? null : listingId);

    if (!currentReportId || listingId === 'none') return;

    try {
      await linkReportToListing(currentReportId, listingId);
      const listing = await getLinkedListing(currentReportId);
      if (listing) setLinkedListing(listing);
      toast({ title: 'Linked', description: 'Report linked to vehicle listing' });
    } catch (err: any) {
      toast({ title: 'Error linking', description: err.message, variant: 'destructive' });
    }
  };

  const handleAutoFill = () => {
    const painted = Object.entries(bodyParts)
      .filter(([_, status]) => status !== 'original')
      .map(([part]) => part.replace(/([A-Z])/g, ' $1').trim())
      .join(', ');

    const template = `Inspection Summary

Vehicle Details:
- ${carInfo.brand} ${carInfo.model} (${carInfo.year})
- VIN: ${carInfo.vin || 'N/A'}
- Mileage: ${carInfo.mileage || 'N/A'} km
- Overall Condition: ${overallCondition.toUpperCase()}

Body Condition:
${painted ? `- Painted/Repaired Parts: ${painted}` : '- All body parts original'}

Health Score: ${healthScore}/100

Notes: [Add detailed inspection notes here]`;

    setSummary(template);
  };

  const [activeTire, setActiveTire] = useState<keyof TiresStatus | null>(null);
  const [isTireModalOpen, setIsTireModalOpen] = useState(false);
  const [tempTireData, setTempTireData] = useState<TireDetails>({ ...DEFAULT_TIRE_DETAILS });

  const handleTireClick = (tire: keyof TiresStatus) => {
    setActiveTire(tire);
    setTempTireData(tiresStatus[tire] as TireDetails);
    setIsTireModalOpen(true);
  };

  const handleTireSave = () => {
    if (activeTire) {
      setTiresStatus((prev) => ({ ...prev, [activeTire]: tempTireData }));
    }
    setIsTireModalOpen(false);
  };

  const handleApplyToAll = () => {
    const { condition, brand, size } = tempTireData;
    setTiresStatus((prev) => ({
      frontLeft: { ...prev.frontLeft, condition, brand, size },
      frontRight: { ...prev.frontRight, condition, brand, size },
      rearLeft: { ...prev.rearLeft, condition, brand, size },
      rearRight: { ...prev.rearRight, condition, brand, size },
      spare: prev.spare,
    }));
  };

  const printableReportId =
    reportDisplayId || currentReportId?.slice(0, 8).toUpperCase() || 'N/A';
  const printableDate = carInfo.date
    ? new Date(carInfo.date).toLocaleDateString()
    : new Date().toLocaleDateString();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading report...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F7F6F2] text-foreground dark:bg-background">
        <div className="max-w-[1600px] mx-auto">
          {/* Professional PDF Header - Only in print mode */}
          {isPrintMode && (
            <div className="print-header">
              <div className="print-brand">
                <div className="print-brand-mark">EZ</div>
                <div>
                  <div className="print-brand-text">EZCAR24</div>
                  <div className="print-brand-sub">Inspection Report</div>
                </div>
              </div>
              <div className="print-meta">
                <div><strong>Report ID:</strong> {printableReportId}</div>
                <div><strong>Date:</strong> {printableDate}</div>
              </div>
            </div>
          )}

          {/* Top Toolbar */}
          <InspectionToolbar
            currentReportId={currentReportId}
            onReportIdChange={setCurrentReportId}
            onReset={handleReset}
            onShare={handleShare}
            saving={saving}
            loading={loading}
            readOnly={readOnly}
            onLoadReport={loadReport}
            forceReadOnly={!!forceReadOnly}
          />

          {/* Header */}
          <InspectionHeader
            reportDisplayId={reportDisplayId || currentReportId?.slice(0, 8).toUpperCase() || ''}
            inspectionDate={carInfo.date}
            healthScore={healthScore}
            carDetails={{
              year: carInfo.year,
              make: carInfo.brand,
              model: carInfo.model,
            }}
          />

          {/* Main Content */}
          <div className="p-4 md:p-8 space-y-8 print:p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print-grid">

              {/* Photos - Moved to top for better mobile experience */}
              <PhotoGallerySection
                photos={photos}
                onPhotosChange={setPhotos}
                onUpload={handlePhotoUpload}
                readOnly={readOnly}
                saving={saving}
              />

              <KeyFindingsSection findings={keyFindings} />

              {/* Vehicle Identity */}
              <VehicleIdentityCard
                carInfo={carInfo}
                onChange={(field, value) => setCarInfo((prev) => ({ ...prev, [field]: value }))}
                readOnly={readOnly}
              />

              {/* Car Diagram */}
              <BodyConditionSection
                bodyParts={bodyParts}
                onBodyPartsChange={setBodyParts}
                tiresStatus={tiresStatus}
                onTireClick={handleTireClick}
                readOnly={readOnly}
              />

              {/* Overall & Mechanical */}
              <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4 print-col-4">
                <OverallConditionCard
                  condition={overallCondition}
                  onChange={setOverallCondition}
                  readOnly={readOnly}
                />
                <MechanicalSection
                  mechanicalStatus={mechanicalStatus}
                  onMechanicalChange={setMechanicalStatus}
                  readOnly={readOnly}
                />
              </div>

              {/* Tires */}
              <TireSection
                tiresStatus={tiresStatus}
                onTiresChange={setTiresStatus}
                readOnly={readOnly}
              />

              {/* Interior */}
              <InteriorSection
                interiorStatus={interiorStatus}
                onInteriorChange={setInteriorStatus}
                readOnly={readOnly}
              />

              {/* Summary */}
              <SummarySection
                summary={summary}
                onSummaryChange={setSummary}
                bodyParts={bodyParts}
                onAutoFill={handleAutoFill}
                readOnly={readOnly}
              />

              <RecommendationsSection
                recommendations={recommendations}
                onChange={setRecommendations}
                readOnly={readOnly}
              />

              {/* Service History */}
              <ServiceHistorySection
                serviceHistory={serviceHistory}
                onServiceHistoryChange={setServiceHistory}
                readOnly={readOnly}
              />

              {/* Publish & Share Section */}
              <PublishShareSection
                forceReadOnly={!!forceReadOnly}
                reportStatus={reportStatus}
                shareSlug={shareSlug}
                linkedListing={linkedListing}
                selectedListingId={selectedListingId}
                availableListings={availableListings}
                onListingChange={handleListingChange}
                onGenerateReport={handleGenerateReport}
                onUnfreezeReport={handleUnfreezeReport}
                isGenerating={isGenerating}
                isAdmin={isAdmin}
                carInfo={carInfo}
                onToast={toast}
                currentReportId={currentReportId}
                readOnly={readOnly}
              />

              {/* Verification QR Code */}
              <div className="col-span-1 md:col-span-12 mt-8 flex flex-col items-center justify-center gap-2 print:hidden">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-border/50">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    size={80}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">
                  Scan to Verify
                </p>
              </div>

              {/* Disclaimer Section */}
              <div className="col-span-1 md:col-span-12 mt-8 pt-6 pb-24 md:pb-6 border-t border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground/60 italic max-w-3xl mx-auto leading-relaxed">
                  <span className="font-semibold not-italic">Disclaimer:</span> This report represents a preliminary, reliable assessment of the vehicle's condition at the time of inspection. It is not a fully comprehensive or exhaustive technical examination. The provider assumes no liability for latent defects or issues not identified during this standard inspection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {isPrintMode && (
          <div className="hidden print:flex print-footer items-center justify-between gap-3">
            <div className="flex flex-col items-start">
              <div className="text-[11px] font-semibold text-slate-900">
                EZCAR24 Certified Inspection
              </div>
              <div className="text-[10px] text-slate-500">
                {inspectorName && <span>Inspector: {inspectorName}</span>}
                {contactPhone && <span> · {contactPhone}</span>}
                {contactEmail && <span> · {contactEmail}</span>}
              </div>
              {publicReportUrl && (
                <div className="text-[9px] text-slate-400 mt-0.5">{publicReportUrl}</div>
              )}
            </div>
            {publicReportQrUrl && (
              <img
                src={publicReportQrUrl}
                alt="Report QR code"
                className="w-16 h-16 object-contain"
              />
            )}
          </div>
        )}

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

        {/* PDF Ready Marker - Hidden element to signal Playwright that page is ready */}
        {!loading && <div data-pdf-ready="true" className="hidden" aria-hidden="true" />}



      </div>
    </TooltipProvider>
  );
};

export default CarInspectionReport;
