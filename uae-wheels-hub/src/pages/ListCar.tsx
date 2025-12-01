import Header from '@/components/Header';
import EnhancedPhotoUploader from '@/components/EnhancedPhotoUploader';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import BrandsCombobox from '@/components/BrandsCombobox';
import ModelsCombobox from '@/components/ModelsCombobox';
import TrimsCombobox from '@/components/TrimsCombobox';
import { SpecSelect } from '@/components/SpecSelect';
import { CitySelect } from '@/components/CitySelect';
import { FormProgress } from '@/components/FormProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PhoneInputMask from '@/components/PhoneInputMask';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Car, Camera, Phone, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import HCaptcha from '@/components/HCaptcha';
import { FUEL_TYPES, TRANSMISSION_TYPES, BODY_TYPES } from '@/types/filters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatSpec, formatCity } from '@/utils/formatters';
import { sanitizeText, sanitizeDescription, sanitizePrice, sanitizeYear, sanitizeMileage, validateForm } from '@/utils/inputSanitizer';

const ListCar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Feature flag: enable captcha only if explicitly turned on AND sitekey present
  const captchaEnabled: boolean = ((import.meta as any).env.VITE_ENABLE_HCAPTCHA === 'true') && Boolean((import.meta as any).env.VITE_HCAPTCHA_SITEKEY);

  const requiredFields = ['title', 'make', 'model', 'year', 'mileage', 'spec', 'city'];
  const requiredFilled = (f: typeof form) => {
    return requiredFields.every(field => {
      const value = f[field];
      if (value === null || value === undefined) return false;
      const stringValue = String(value).trim();
      return stringValue.length > 0;
    });
  };

  // Form fields
  const [form, setForm] = useState({
    title: '',
    price: '',
    make: '',
    model: '',
    trim: '',
    year: '',
    mileage: '',
    spec: '',
    city: '',
    description: '',
    phone: '',
    whatsapp: '',
    fuelType: '',
    transmission: '',
    bodyType: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    { id: 1, title: 'Car Details', icon: Car, description: 'Make, model, & year' },
    { id: 2, title: 'Specs & Info', icon: MessageSquare, description: 'Condition & features' },
    { id: 3, title: 'Photos', icon: Camera, description: 'Upload images' },
    { id: 4, title: 'Finalize', icon: Phone, description: 'Price & contact' },
  ];

  const isStepValid = () => {
    if (currentStep === 1) {
      return form.title && form.make && form.model && form.year && form.city && form.spec;
    }
    if (currentStep === 2) {
      return form.mileage && form.fuelType && form.transmission && form.bodyType;
    }
    if (currentStep === 3) {
      return true; // Photos are handled separately, maybe require at least one?
    }
    if (currentStep === 4) {
      return form.price && form.phone;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [listingId, setListingId] = useState<string | null>(null);

  const ensureDraftListing = async (): Promise<string> => {
    if (listingId) {
      console.log('ListCar: Using existing listingId:', listingId);
      return listingId;
    }
    if (!user) throw new Error('Not signed in');
    console.log('ListCar: Creating new draft listing');
    const { data, error } = await supabase
      .from('listings')
      .insert({ user_id: user.id, title: form.title || 'Draft', is_draft: true } as any)
      .select('id')
      .single();
    if (error) throw error;
    console.log('ListCar: Created draft listing with ID:', data.id);
    setListingId(data.id);
    return data.id as string;
  };

  const [searchParams] = useSearchParams();

  // Load existing listing when in edit mode (?edit=ID)
  useEffect(() => {
    const editId = searchParams.get('edit');



    if (!editId) {
      console.log('❌ No edit ID in URL');
      return;
    }

    if (!user) {
      console.log('❌ User not loaded yet');
      return;
    }

    const loadExisting = async () => {
      try {
        setLoadingEdit(true);





        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            listing_images (
              id,
              url,
              sort_order,
              is_cover
            )
          `)
          .eq('id', editId)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle();



        if (error) {
          toast({
            title: 'Database Error',
            description: `Error: ${error.message}`,
            variant: 'destructive'
          });
          navigate('/profile/my-listings');
          return;
        }

        if (!data) {
          toast({
            title: 'Cannot Edit Listing',
            description: 'Listing not found or you do not have access.',
            variant: 'destructive'
          });
          navigate('/profile/my-listings');
          return;
        }

        const listing = data as any;
        setListingId(listing.id);
        setForm({
          title: listing.title ?? '',
          price: listing.price != null ? String(listing.price) : '',
          make: listing.make ?? '',
          model: listing.model ?? '',
          trim: listing.trim ?? '',
          year: listing.year != null ? String(listing.year) : '',
          mileage: listing.mileage != null ? String(listing.mileage) : '',
          spec: listing.spec ?? '',
          city: listing.city ?? '',
          description: listing.description ?? '',
          phone: listing.phone ?? '',
          whatsapp: listing.whatsapp ?? '',
          fuelType: listing.fuel_type ?? '',
          transmission: listing.transmission ?? '',
          bodyType: listing.body_type ?? '',
        });

        // Images will be loaded by EnhancedPhotoUploader component automatically

        toast({ title: 'Listing Loaded', description: 'Ready to edit your listing.' });
      } catch (e) {
        console.error('Failed to load listing for edit', e);
        toast({ title: 'Error', description: 'Failed to load listing for editing.', variant: 'destructive' });
      } finally {
        setLoadingEdit(false);
      }
    };

    loadExisting();
  }, [searchParams, user?.id, navigate, toast]);




  const validateFormData = () => {
    const validation = validateForm(form);
    return validation.errors;
  };

  const canSubmit = () => {
    const key = 'last_publish_time';
    const now = Date.now();
    const last = Number(localStorage.getItem(key) || '0');
    if (now - last < 60_000) { // 1 minute throttle
      toast({ title: 'Please wait a moment', description: 'You can publish only once per minute to prevent spam.', variant: 'destructive' });
      return false;
    }
    localStorage.setItem(key, String(now));
    return true;
  };

  const onPublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) return;

    // Validate and sanitize form data
    const errors = validateFormData();

    // Require captcha token only if captcha is enabled
    if (captchaEnabled && !captchaToken) {
      toast({ title: 'Verification required', description: 'Please complete the hCaptcha challenge.', variant: 'destructive' });
      return;
    }
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fix: ${errors.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Sanitize all inputs before submission
    const sanitizedForm = {
      title: sanitizeText(form.title),
      price: sanitizePrice(form.price),
      make: sanitizeText(form.make),
      model: sanitizeText(form.model),
      year: sanitizeYear(form.year),
      mileage: sanitizeMileage(form.mileage),
      spec: sanitizeText(form.spec),
      city: sanitizeText(form.city),
      description: sanitizeDescription(form.description), // Use special sanitizer for description
      phone: sanitizeText(form.phone),
      whatsapp: sanitizeText(form.whatsapp),
      fuelType: sanitizeText(form.fuelType),
      transmission: sanitizeText(form.transmission),
      bodyType: sanitizeText(form.bodyType),
    };

    // Validate sanitized data
    if (!sanitizedForm.title || !sanitizedForm.make || !sanitizedForm.model ||
      !sanitizedForm.year || !sanitizedForm.mileage || !sanitizedForm.spec || !sanitizedForm.city) {
      toast({
        title: 'Invalid Data',
        description: 'Some fields contain invalid data. Please check your inputs.',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({ title: 'Please sign in', description: 'You must be signed in to list a car.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let id = listingId;

      // Create or update the listing
      if (!id) {
        // Create new listing
        const { data: newListing, error: createError } = await supabase
          .from('listings')
          .insert({
            user_id: user.id,
            title: sanitizedForm.title,
            price: sanitizedForm.price,
            make: sanitizedForm.make,
            model: sanitizedForm.model,
            year: sanitizedForm.year,
            mileage: sanitizedForm.mileage,
            spec: sanitizedForm.spec,
            city: sanitizedForm.city,
            description: sanitizedForm.description,
            phone: sanitizedForm.phone,
            whatsapp: sanitizedForm.whatsapp,
            fuel_type: sanitizedForm.fuelType,
            transmission: sanitizedForm.transmission,
            body_type: sanitizedForm.bodyType,
            is_draft: false,
            moderation_status: 'pending',
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        id = newListing.id;
        console.log('ListCar: Created new listing with ID:', id);
        setListingId(id);
      } else {
        // Update existing draft
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            title: sanitizedForm.title,
            price: sanitizedForm.price,
            make: sanitizedForm.make,
            model: sanitizedForm.model,
            year: sanitizedForm.year,
            mileage: sanitizedForm.mileage,
            spec: sanitizedForm.spec,
            city: sanitizedForm.city,
            description: sanitizedForm.description,
            phone: sanitizedForm.phone,
            whatsapp: sanitizedForm.whatsapp,
            fuel_type: sanitizedForm.fuelType,
            transmission: sanitizedForm.transmission,
            body_type: sanitizedForm.bodyType,
            is_draft: false,
            moderation_status: 'pending',
            status: 'active'
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        console.log('ListCar: Updated existing listing with ID:', id);
      }

      setConfirmOpen(true);
      setPublishedId(id);

      // Log activity (optional - don't fail publish if this fails)
      try {
        await supabase.from('activities').insert({
          user_id: user.id,
          type: 'listing_published',
          description: `Published listing: ${form.title || 'Untitled'}`,
          listing_id: id
        });
      } catch (activityError) {
        // Ignore activity logging errors
        console.warn('Failed to log activity:', activityError);
      }

    } catch (err: any) {
      console.error('Publish error:', err);
      toast({
        title: "Failed to publish listing",
        description: err?.message || 'Please check your inputs and try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = async () => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You must be signed in to save a draft.', variant: 'destructive' });
      return;
    }

    setDraftSaving(true);
    try {
      let id = listingId;

      if (!id) {
        // Create new draft
        const { data: newListing, error: createError } = await supabase
          .from('listings')
          .insert({
            user_id: user.id,
            title: form.title?.trim() || 'Draft',
            price: form.price ? parseInt(form.price.toString()) : null,
            make: form.make?.trim() || null,
            model: form.model?.trim() || null,
            year: form.year ? parseInt(form.year.toString()) : null,
            mileage: form.mileage ? parseInt(form.mileage.toString()) : null,
            spec: form.spec?.trim() || null,
            city: form.city?.trim() || null,
            description: form.description ? sanitizeDescription(form.description) : null,
            phone: form.phone?.trim() || null,
            whatsapp: form.whatsapp?.trim() || null,
            fuel_type: form.fuelType?.trim() || null,
            transmission: form.transmission?.trim() || null,
            body_type: form.bodyType?.trim() || null,
            is_draft: true
          })
          .select('id')
          .single();

        if (createError) throw createError;
        id = newListing.id;
        setListingId(id);
      } else {
        // Update existing draft
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            title: form.title?.trim() || 'Draft',
            price: form.price ? parseInt(form.price.toString()) : null,
            make: form.make?.trim() || null,
            model: form.model?.trim() || null,
            year: form.year ? parseInt(form.year.toString()) : null,
            mileage: form.mileage ? parseInt(form.mileage.toString()) : null,
            spec: form.spec?.trim() || null,
            city: form.city?.trim() || null,
            description: form.description ? sanitizeDescription(form.description) : null,
            phone: form.phone?.trim() || null,
            whatsapp: form.whatsapp?.trim() || null,
            fuel_type: form.fuelType?.trim() || null,
            transmission: form.transmission?.trim() || null,
            body_type: form.bodyType?.trim() || null,
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      toast({ title: 'Draft saved', description: 'You can continue later.' });
      // Redirect user to their drafts page for clarity
      navigate('/profile/drafts');
    } catch (err: any) {
      console.error('Save draft error:', err);
      toast({ title: 'Failed to save draft', description: err.message, variant: 'destructive' });
    } finally {
      setDraftSaving(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    // load cover when listing exists
    const loadCover = async () => {
      if (!listingId) return;
      const { data } = await supabase
        .from('listing_images')
        .select('url')
        .eq('listing_id', listingId)
        .eq('is_cover', true)
        .maybeSingle();
      setCoverUrl(data?.url ?? null);
    };
    loadCover();
  }, [listingId, confirmOpen]);

  // Auto-redirect to My Listings shortly after successful publish
  useEffect(() => {
    if (!confirmOpen) return;
    const t = setTimeout(() => {
      navigate('/profile/my-listings');
    }, 2000);
    return () => clearTimeout(t);
  }, [confirmOpen, navigate]);


  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-32 md:pb-12">

        {/* Header & Stepper */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
            {searchParams.get('edit') ? 'Edit Your Listing' : 'List Your Car'}
          </h1>
          <p className="text-center text-muted-foreground mb-8 text-lg">
            Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
          </p>

          {/* Stepper UI */}
          <div className="relative flex justify-between items-center max-w-2xl mx-auto mb-12 px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 ease-in-out -z-10"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />

            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center bg-background px-2">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-lg' :
                      isCompleted ? 'border-primary bg-primary text-primary-foreground' :
                        'border-muted-foreground/30 text-muted-foreground bg-background'
                      }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <span className={`text-xs md:text-sm font-medium mt-3 hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-3xl mx-auto">
          <Card className="border-border shadow-lg">
            <CardContent className="p-6 sm:p-8 space-y-6 min-h-[400px]">

              {/* Step 1: Car Details */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-base">Title <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. 2021 Toyota Camry SE"
                      className="h-12 text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Make <span className="text-destructive">*</span></Label>
                      <BrandsCombobox
                        value={form.make}
                        onChange={v => setForm({ ...form, make: v, model: '', trim: '' })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model <span className="text-destructive">*</span></Label>
                      <ModelsCombobox
                        value={form.model}
                        onChange={v => setForm({ ...form, model: v, trim: '' })}
                        selectedMake={form.make}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Trim</Label>
                      <TrimsCombobox
                        value={form.trim}
                        onChange={v => setForm({ ...form, trim: v })}
                        selectedMake={form.make}
                        selectedModel={form.model}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        value={form.year}
                        onChange={e => setForm({ ...form, year: e.target.value })}
                        className="h-11"
                        placeholder="e.g. 2021"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Spec <span className="text-destructive">*</span></Label>
                      <SpecSelect value={form.spec} onChange={v => setForm({ ...form, spec: v })} />
                    </div>
                    <div className="space-y-2">
                      <Label>City <span className="text-destructive">*</span></Label>
                      <CitySelect value={form.city} onChange={v => setForm({ ...form, city: v })} />
                    </div>
                  </div>

                  {/* Quick fill buttons */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">Quick fill:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm(f => ({ ...f, year: String(new Date().getFullYear()) }))}
                      >
                        Current Year
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm(f => ({ ...f, city: 'dubai', spec: 'gcc' }))}
                      >
                        GCC · Dubai
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Specs & Info */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-base">Mileage (km) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      value={form.mileage}
                      onChange={e => setForm({ ...form, mileage: e.target.value })}
                      className="h-12 text-lg"
                      placeholder="e.g. 45,000"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Fuel Type</Label>
                      <Select value={form.fuelType} onValueChange={v => setForm({ ...form, fuelType: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {FUEL_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Transmission</Label>
                      <Select value={form.transmission} onValueChange={v => setForm({ ...form, transmission: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {TRANSMISSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Body Type</Label>
                      <Select value={form.bodyType} onValueChange={v => setForm({ ...form, bodyType: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {BODY_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={8}
                      placeholder="Describe condition, features, service history..."
                      className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      Detailed descriptions help buyers make informed decisions.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-muted/30 p-6 rounded-xl border border-dashed text-center mb-6">
                    <Camera className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <h3 className="font-medium text-lg mb-1">Upload Photos</h3>
                    <p className="text-sm text-muted-foreground">
                      High-quality photos get more views. Add at least 3 photos.
                    </p>
                  </div>
                  <EnhancedPhotoUploader
                    userId={user?.id ?? ''}
                    listingId={listingId}
                    ensureDraftListing={ensureDraftListing}
                  />
                </div>
              )}

              {/* Step 4: Finalize */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-3">
                    <Label className="text-lg">Price (AED) <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">AED</span>
                      <Input
                        type="number"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        className="h-14 text-xl font-bold pl-14"
                        placeholder="65,000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Phone (Optional)</Label>
                      <PhoneInputMask
                        value={form.phone || ''}
                        onChange={v => setForm(f => ({ ...f, phone: v }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp (Optional)</Label>
                      <PhoneInputMask
                        value={form.whatsapp || ''}
                        onChange={v => setForm(f => ({ ...f, whatsapp: v }))}
                      />
                    </div>
                  </div>

                  {/* Captcha */}
                  {captchaEnabled && (
                    <div className="flex justify-center py-4">
                      <HCaptcha onVerify={(t) => setCaptchaToken(t)} theme="light" />
                    </div>
                  )}

                  {/* Preview Box */}
                  <div className="mt-8 p-5 border rounded-xl bg-muted/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Ready to publish?</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Review your listing details one last time.
                        </p>
                        <div className="text-sm bg-background p-3 rounded border">
                          <p className="font-bold text-foreground text-lg">{form.title || 'Untitled Listing'}</p>
                          <p className="mt-1 text-muted-foreground">{form.year} • {form.make} {form.model}</p>
                          <p className="mt-2 text-primary font-bold text-xl">{form.price ? `AED ${Number(form.price).toLocaleString()}` : 'Price TBD'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>

            <div className="p-6 border-t bg-muted/5 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="w-24 hover:bg-muted"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={draftSaving}
                  className="hidden sm:flex"
                >
                  Save Draft
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="w-32 bg-primary hover:bg-primary/90 shadow-sm"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={onPublish}
                    disabled={saving || !isStepValid() || (captchaEnabled && !captchaToken)}
                    className="w-40 bg-primary hover:bg-primary/90 shadow-md text-lg h-11"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Publishing
                      </div>
                    ) : 'Publish Now'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />

      {/* Success Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Check className="w-5 h-5" /> Submitted for Review
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Your listing was submitted and is pending moderation. You'll see it live once it's approved.
            </p>
            {coverUrl ? (
              <div className="mb-4">
                <img src={coverUrl} alt="Car cover" className="w-full h-40 object-cover rounded-lg border shadow-sm" />
              </div>
            ) : (
              <div className="bg-muted/50 p-4 rounded-lg border border-dashed mb-4 text-center">
                <p className="text-sm text-muted-foreground">No cover image set</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                navigate('/profile/my-listings');
              }}
              className="w-full sm:w-auto"
            >
              Go to My Listings
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                navigate('/profile/my-listings');
              }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListCar;
