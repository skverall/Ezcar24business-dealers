# CarInspectionReport - Usage Example

This document shows how to use the extracted components in the refactored `CarInspectionReport.tsx`.

## Import Components

```typescript
import {
  InspectionHeader,
  HealthScoreGauge,
  VehicleIdentityCard,
  PhotoGallerySection,
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
} from '@/features/inspection/components';
```

## Basic Usage Pattern

### 1. InspectionHeader

```tsx
<InspectionHeader
  reportDisplayId={reportDisplayId}
  inspectionDate={carInfo.date}
  healthScore={healthScore}
/>
```

### 2. PhotoGallerySection

```tsx
<PhotoGallerySection
  photos={photos}
  onPhotosChange={setPhotos}
  onUpload={handlePhotoUpload}
  readOnly={readOnly}
  saving={saving}
/>
```

### 3. VehicleIdentityCard

```tsx
<VehicleIdentityCard
  carInfo={carInfo}
  onChange={(field, value) => setCarInfo(prev => ({ ...prev, [field]: value }))}
  readOnly={readOnly}
/>
```

### 4. BodyConditionSection

```tsx
<BodyConditionSection
  bodyParts={bodyParts}
  onBodyPartsChange={setBodyParts}
  tiresStatus={tiresStatus}
  onTireClick={(tire) => {
    setActiveTire(tire);
    setIsTireModalOpen(true);
  }}
  readOnly={readOnly}
/>
```

### 5. OverallConditionCard

```tsx
<OverallConditionCard
  condition={overallCondition}
  onChange={setOverallCondition}
  readOnly={readOnly}
/>
```

### 6. MechanicalSection

```tsx
<MechanicalSection
  mechanicalStatus={mechanicalStatus}
  onMechanicalChange={setMechanicalStatus}
  readOnly={readOnly}
/>
```

### 7. TireSection

```tsx
<TireSection
  tiresStatus={tiresStatus}
  onTiresChange={setTiresStatus}
  readOnly={readOnly}
/>
```

### 8. InteriorSection

```tsx
<InteriorSection
  interiorStatus={interiorStatus}
  onInteriorChange={setInteriorStatus}
  readOnly={readOnly}
/>
```

### 9. SummarySection

```tsx
<SummarySection
  summary={summary}
  onSummaryChange={setSummary}
  bodyParts={bodyParts}
  onAutoFill={handleAutoFill}
  readOnly={readOnly}
/>
```

### 10. ServiceHistorySection

```tsx
<ServiceHistorySection
  serviceHistory={serviceHistory}
  onServiceHistoryChange={setServiceHistory}
  readOnly={readOnly}
/>
```

### 11. InspectionActions

```tsx
<InspectionActions
  // Toolbar props
  currentReportId={currentReportId}
  onReportIdChange={setCurrentReportId}
  onReset={handleReset}
  onShare={handleShare}
  onSave={handleSave}
  saving={saving}
  loading={loading}
  readOnly={readOnly}
  onLoadReport={loadReport}

  // Publish & Share props
  forceReadOnly={forceReadOnly}
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
```

## Calculate Health Score

```typescript
import { calculateHealthScore } from '@/features/inspection/components';

const healthScore = useMemo(() => {
  return calculateHealthScore(
    mechanicalStatus,
    bodyParts,
    tiresStatus,
    interiorStatus
  );
}, [mechanicalStatus, bodyParts, tiresStatus, interiorStatus]);
```

## Full Layout Example

```tsx
<div className="min-h-screen bg-background">
  <div className="max-w-[1600px] mx-auto">
    {/* Toolbar */}
    <InspectionActions {...toolbarProps} />

    {/* Header */}
    <InspectionHeader
      reportDisplayId={reportDisplayId}
      inspectionDate={carInfo.date}
      healthScore={healthScore}
    />

    {/* Main Content */}
    <div className="p-4 md:p-8 space-y-8">
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Photos - Full Width */}
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
          onChange={(field, value) => setCarInfo(prev => ({ ...prev, [field]: value }))}
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
        <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
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
      </div>
    </div>
  </div>
</div>
```

## Benefits of This Structure

### ✅ Easier Debugging
- Each component is isolated and self-contained
- Bug in tires? → Check `TireSection.tsx` (273 lines)
- Bug in photos? → Check `PhotoGallerySection.tsx` (113 lines)

### ✅ Better Testability
```typescript
// Example test
import { OverallConditionCard } from '@/features/inspection/components';

describe('OverallConditionCard', () => {
  it('changes condition on button click', () => {
    const onChange = vi.fn();
    render(<OverallConditionCard condition="good" onChange={onChange} />);
    fireEvent.click(screen.getByText('excellent'));
    expect(onChange).toHaveBeenCalledWith('excellent');
  });
});
```

### ✅ Reusability
All components can be reused in other parts of the app:
- `HealthScoreGauge` → Dashboard summary
- `StatusIndicator` → Any status display
- `SpecField` → Any form with labeled inputs

### ✅ Code Splitting
```typescript
// Lazy load the entire inspection feature
const CarInspectionReport = lazy(() => import('@/features/inspection/CarInspectionReport'));
```

## Migration Checklist

When refactoring the main `CarInspectionReport.tsx`:

1. ✅ Import all components from `@/features/inspection/components`
2. ✅ Replace inline JSX with component usage
3. ✅ Keep all state management in parent component
4. ✅ Pass state down via props
5. ✅ Pass callbacks for state updates
6. ✅ Verify all functionality works identically
7. ✅ Run TypeScript type check: `npx tsc --noEmit`
8. ✅ Test all interactions (modals, save, freeze, etc.)
9. ✅ Test print functionality
10. ✅ Test mobile responsiveness

## Notes

- All components maintain backward compatibility
- No breaking changes to external API
- All TypeScript types are exported
- All components support `readOnly` prop
- All components are responsive (mobile-first)
