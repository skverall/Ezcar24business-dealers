import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  TireDetails as TireDetailsType,
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
import MechanicalChecklistModal, {
  MechanicalStatus,
  DEFAULT_CHECKLISTS,
} from './MechanicalChecklistModal';
import { InteriorStatus, DEFAULT_INTERIOR_STATUS } from './InteriorChecklist';
import { ServiceRecord } from '@/types/inspection';

// Import all extracted components
import {
  InspectionHeader,
  PhotoGallerySection,
  VehicleIdentityCard,
  BodyConditionSection,
  OverallConditionCard,
  MechanicalSection,
  TireSection,
  InteriorSection,
  SummarySection,
  ServiceHistorySection,
  InspectionActions,
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

interface TireDetails extends TireDetailsType {
  present?: boolean;
}

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

const DEFAULT_TIRES: TiresStatus = {
  frontLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  frontRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  rearLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  rearRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  spare: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '', present: true },
};

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
const encodeSummary = (carInfo: CarInfo, summary: string, serviceHistory: ServiceRecord[]) => {
  const payload = { carInfo, summary, serviceHistory };
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

const CarInspectionReport: React.FC<Props> = ({ reportId, readOnly: forceReadOnly, initialData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const isAuthor = !!(user?.id && authorUserId === user.id);

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

  const [overallCondition, setOverallCondition] = useState<
    'excellent' | 'good' | 'fair' | 'poor' | 'salvage'
  >(initialData?.overall_condition || 'fair');
  const [summary, setSummary] = useState(initialData?.notes || '');

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
    initialData?.mechanical_checklist || {}
  );

  const [tiresStatus, setTiresStatus] = useState<TiresStatus>(
    initialData?.tires_status || DEFAULT_TIRES
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
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    initialData?.listing?.id || null
  );

  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [availableListings, setAvailableListings] = useState<
    Array<{ id: string; title: string; make: string; model: string; year: number; vin?: string }>
  >([]);

  const [linkedListing, setLinkedListing] = useState<LinkedListing | null>(
    initialData?.listing || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportDisplayId, setReportDisplayId] = useState<string>(initialData?.display_id || '');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      if (decoded) {
        setCarInfo((prev) => ({ ...prev, ...decoded.carInfo }));
        setSummary(decoded.summary || '');
        setServiceHistory(decoded.serviceHistory || []);
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

      setMechanicalStatus(data.mechanical_checklist || {});
      setTiresStatus(data.tires_status || DEFAULT_TIRES);
      setInteriorStatus(data.interior_status || DEFAULT_INTERIOR_STATUS);
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

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'Must be logged in to save', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let authorId = authorUserId;
      if (!authorId) {
        const ensured = await ensureAuthorForUser(user.id, inspectorName, contactEmail, contactPhone);
        if (!ensured) throw new Error('Could not create author record');
        authorId = user.id;
        setAuthorUserId(user.id);
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

      const summaryEncoded = encodeSummary(carInfo, summary, serviceHistory);

      const result = await saveReport({
        id: currentReportId,
        author_id: authorId,
        vin: carInfo.vin,
        make: carInfo.brand,
        model: carInfo.model,
        year: parseInt(carInfo.year) || null,
        odometer_km: parseInt(carInfo.mileage) || null,
        location: carInfo.location,
        inspection_date: carInfo.date,
        overall_condition: overallCondition,
        body_parts: bodyPartsArray,
        mechanical_checklist: mechanicalStatus,
        tires_status: tiresStatus,
        interior_status: interiorStatus,
        notes: summary,
        summary: summaryEncoded,
        number_of_owners: parseInt(carInfo.owners) || null,
        mulkia_expiry: carInfo.mulkiaExpiry || null,
        regional_specs: carInfo.regionalSpecs || null,
        body_type: carInfo.bodyType || null,
        fuel_type: carInfo.fuelType || null,
        engine_size: carInfo.engineSize || null,
        horsepower: carInfo.horsepower || null,
        color: carInfo.color || null,
        cylinders: carInfo.cylinders || null,
        transmission: carInfo.transmission || null,
        number_of_keys: carInfo.keys || null,
        options: carInfo.options || null,
      });

      if (!currentReportId) {
        setCurrentReportId(result.id);
        setReportDisplayId(result.display_id);
      }

      await logReportAction(result.id, 'save', 'Updated report data');
      toast({ title: 'Saved', description: 'Report saved successfully' });
    } catch (err: any) {
      toast({ title: 'Error saving report', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentReportId || !canEdit) return;

    const files = Array.from(e.target.files);
    setSaving(true);

    try {
      for (const file of files) {
        const url = await uploadReportPhoto(currentReportId, file);
        setPhotos((prev) => [...prev, { storage_path: url, label: file.name }]);
      }
      toast({ title: 'Photos uploaded', description: `${files.length} photo(s) added` });
    } catch (err: any) {
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
      setTiresStatus(DEFAULT_TIRES);
      setInteriorStatus(DEFAULT_INTERIOR_STATUS);
      setPhotos([]);
      setServiceHistory([]);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Report URL copied to clipboard.' });
  };

  const handleGenerateReport = async () => {
    if (!currentReportId) {
      toast({
        title: 'Save first',
        description: 'Please save the report before generating',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await freezeReport(currentReportId);
      setReportStatus(result.status);
      setShareSlug(result.share_slug);

      if (selectedListingId && selectedListingId !== 'none' && !linkedListing) {
        await linkReportToListing(currentReportId, selectedListingId);
        const listing = await getLinkedListing(currentReportId);
        if (listing) setLinkedListing(listing);
      }

      await logReportAction(currentReportId, 'publish', 'Report published (frozen)');
      toast({ title: 'Published', description: 'Report is now public and shareable' });
    } catch (err: any) {
      toast({ title: 'Error generating report', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
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

  const handleMechanicalSave = (categoryKey: string, data: any) => {
    setMechanicalStatus((prev) => ({ ...prev, [categoryKey]: data }));
    setIsModalOpen(false);
  };

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
      <div className="min-h-screen bg-background">
        <div className="max-w-[1600px] mx-auto">
          {/* Toolbar & Publish Section (InspectionActions renders both) */}
          <InspectionActions
            currentReportId={currentReportId}
            onReportIdChange={setCurrentReportId}
            onReset={handleReset}
            onShare={handleShare}
            onSave={handleSave}
            saving={saving}
            loading={loading}
            readOnly={readOnly}
            onLoadReport={loadReport}
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
          />

          {/* Header */}
          <InspectionHeader
            reportDisplayId={reportDisplayId}
            inspectionDate={carInfo.date}
            healthScore={healthScore}
          />

          {/* Main Content */}
          <div className="p-4 md:p-8 space-y-8 print:p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print-grid">
              {/* Photos */}
              <PhotoGallerySection
                photos={photos}
                onPhotosChange={setPhotos}
                onUpload={handlePhotoUpload}
                readOnly={readOnly}
                saving={saving}
              />

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

              {/* Service History */}
              <ServiceHistorySection
                serviceHistory={serviceHistory}
                onServiceHistoryChange={setServiceHistory}
                readOnly={readOnly}
              />

              {/* Publish & Share Section is rendered inside InspectionActions */}
            </div>
          </div>
        </div>

        {/* Modals */}
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
    </TooltipProvider>
  );
};

export default CarInspectionReport;
