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
import { MessageSquare, Car, Camera, Phone } from 'lucide-react';
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
      .insert({ user_id: user.id, title: form.title || 'Draft', is_draft: true })
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

        setListingId(data.id);
        setForm({
          title: data.title ?? '',
          price: data.price != null ? String(data.price) : '',
          make: data.make ?? '',
          model: data.model ?? '',
          trim: data.trim ?? '',
          year: data.year != null ? String(data.year) : '',
          mileage: data.mileage != null ? String(data.mileage) : '',
          spec: data.spec ?? '',
          city: data.city ?? '',
          description: data.description ?? '',
          phone: data.phone ?? '',
          whatsapp: data.whatsapp ?? '',
          fuelType: data.fuel_type ?? '',
          transmission: data.transmission ?? '',
          bodyType: data.body_type ?? '',
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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 list-car-container">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight gradient-text">
            {searchParams.get('edit') ? 'Edit Your Listing' : 'List Your Car'}
            {loadingEdit && <span className="text-sm font-normal text-muted-foreground ml-2">(Loading...)</span>}
          </h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg">
            {searchParams.get('edit')
              ? 'Update your listing details and republish when ready.'
              : 'Create a listing that gets results. Fill in the required fields to publish.'
            }
          </p>
        </div>

        {/* Two-column layout: form + sticky actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          <div className="lg:col-span-3 space-y-8 list-car-form-section">
            {/* Basic Information */}
            <Card className="border-border hover:border-luxury/20 transition-all duration-200">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-luxury/10 rounded-lg flex items-center justify-center">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5 text-luxury" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
                    <CardDescription className="text-sm">Essential details about your car</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g. 2021 Toyota Camry SE"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-11 form-input-mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Price (AED)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g. 65,000"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      min={0}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Make <span className="text-destructive">*</span>
                    </Label>
                    <BrandsCombobox
                      value={form.make}
                      onChange={(v) => setForm({ ...form, make: v, model: '', trim: '' })}
                      placeholder="Select or type make"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Model <span className="text-destructive">*</span>
                    </Label>
                    <ModelsCombobox
                      value={form.model}
                      onChange={(v) => setForm({ ...form, model: v, trim: '' })}
                      selectedMake={form.make}
                      placeholder="Select or type model"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Trim
                    </Label>
                    <TrimsCombobox
                      value={form.trim}
                      onChange={(v) => setForm({ ...form, trim: v })}
                      selectedMake={form.make}
                      selectedModel={form.model}
                      placeholder="Select or type trim"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Year <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2021"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      min={1900}
                      max={new Date().getFullYear() + 1}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Mileage (km) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 45,000"
                      value={form.mileage}
                      onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                      min={0}
                      className="h-11"
                    />
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
                      className="hover:bg-luxury/10 hover:border-luxury"
                    >
                      Current Year ({new Date().getFullYear()})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, mileage: '0' }))}
                      className="hover:bg-luxury/10 hover:border-luxury"
                    >
                      Brand New (0 km)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, city: 'dubai', spec: 'gcc' }))}
                      className="hover:bg-luxury/10 hover:border-luxury"
                    >
                      GCC · Dubai
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="border-border hover:border-luxury/20 transition-all duration-200">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-luxury/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-luxury" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Details</CardTitle>
                    <CardDescription className="text-sm">Tell buyers what makes your car special</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    placeholder="Describe condition, ownership, service history, extras...&#10;&#10;Your formatting (line breaks and paragraphs) will be preserved."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={6}
                    className="resize-y min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Detailed descriptions help buyers make informed decisions. Line breaks and paragraphs will be preserved.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Spec/Market <span className="text-destructive">*</span>
                    </Label>
                    <SpecSelect
                      value={form.spec}
                      onChange={(v) => setForm({ ...form, spec: v })}
                      placeholder="Select spec"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <CitySelect
                      value={form.city}
                      onChange={(v) => setForm({ ...form, city: v })}
                      placeholder="Select city"
                    />
                  </div>
                </div>

                {/* Vehicle Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fuel Type</Label>
                    <Select value={form.fuelType} onValueChange={(v) => setForm({ ...form, fuelType: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map((fuel) => (
                          <SelectItem key={fuel.value} value={fuel.value}>
                            {fuel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Transmission</Label>
                    <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSMISSION_TYPES.map((trans) => (
                          <SelectItem key={trans.value} value={trans.value}>
                            {trans.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Body Type</Label>
                    <Select value={form.bodyType} onValueChange={(v) => setForm({ ...form, bodyType: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_TYPES.map((body) => (
                          <SelectItem key={body.value} value={body.value}>
                            {body.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="border-border hover:border-luxury/20 transition-all duration-200">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-luxury/10 rounded-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-luxury" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Photos</CardTitle>
                    <CardDescription className="text-sm">High-quality photos get more views and inquiries</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedPhotoUploader
                  userId={user?.id ?? ''}
                  listingId={listingId}
                  ensureDraftListing={ensureDraftListing}
                />
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card className="border-border hover:border-luxury/20 transition-all duration-200">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-luxury/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-luxury" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Contact Information</CardTitle>
                    <CardDescription className="text-sm">How buyers can reach you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone (Optional)</Label>
                    <PhoneInputMask
                      value={form.phone || ''}
                      onChange={(v) => setForm(f => ({ ...f, phone: v }))}
                      placeholder="+971 5x xxx xxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Override your profile phone number for this listing
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">WhatsApp (Optional)</Label>
                    <PhoneInputMask
                      value={form.whatsapp || ''}
                      onChange={(v) => setForm(f => ({ ...f, whatsapp: v }))}
                      placeholder="+971 5x xxx xxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enable WhatsApp contact for this listing
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> These contacts will be shown in your listing.
                    If not provided, buyers will contact you via your profile information.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {/* hCaptcha for anti-bot verification */}
              {captchaEnabled && (
                <div className="flex justify-center">
                  <HCaptcha onVerify={(t) => setCaptchaToken(t)} theme="light" />
                </div>
              )}
              <Button
                className="h-12 px-8 bg-luxury hover:bg-luxury/90 text-luxury-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200 text-lg"
                onClick={onPublish}
                disabled={saving || !requiredFilled(form) || (captchaEnabled && !captchaToken)}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-luxury-foreground border-t-transparent rounded-full animate-spin" />
                    {searchParams.get('edit') ? 'Updating...' : 'Publishing...'}
                  </div>
                ) : (
                  searchParams.get('edit') ? 'Update Your Listing' : 'Publish Listing'
                )}
              </Button>

              <Button
                className="h-12 px-8"
                variant="outline"
                onClick={onSaveDraft}
                disabled={draftSaving}
              >
                {draftSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Draft'
                )}
              </Button>
            </div>
          </div>

          {/* Sticky Actions Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="border-border hover:border-luxury/20 transition-all duration-200">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Progress Indicator */}
                <FormProgress
                  requiredFields={requiredFields}
                  formData={form}
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Compact hCaptcha near the top actions to avoid scrolling */}
                  {captchaEnabled && (
                    <div className="flex justify-center">
                      <HCaptcha onVerify={(t) => setCaptchaToken(t)} theme="light" size="compact" />
                    </div>
                  )}
                  <Button
                    className="w-full h-10 sm:h-12 bg-luxury hover:bg-luxury/90 text-luxury-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={onPublish}
                    disabled={saving || !requiredFilled(form) || (captchaEnabled && !captchaToken)}
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-luxury-foreground border-t-transparent rounded-full animate-spin" />
                        {searchParams.get('edit') ? 'Updating...' : 'Publishing...'}
                      </div>
                    ) : (
                      searchParams.get('edit') ? 'Update Your Listing' : 'Publish Listing'
                    )}
                  </Button>

                  <Button
                    className="w-full h-10 sm:h-12"
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={draftSaving}
                  >
                    {draftSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      'Save Draft'
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  You can edit or complete missing details anytime before publishing.
                </div>

                {/* Preview */}
                {form.title && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="font-medium text-sm line-clamp-1">{form.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {[
                          form.spec && formatSpec(form.spec),
                          form.city && formatCity(form.city),
                          form.year,
                          form.mileage && `${form.mileage} km`,
                          form.price && `AED ${Number(form.price).toLocaleString()}`
                        ].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        {/* Success Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-luxury">Submitted for Review</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Your listing was submitted and is pending moderation. You'll see it live once it's approved.
              </p>
              {coverUrl ? (
                <div className="mb-4">
                  <img src={coverUrl} alt="Car cover" className="w-full h-32 object-cover rounded-md border" />
                  <p className="text-xs text-muted-foreground mt-2">Cover image</p>
                </div>
              ) : (
                <div className="bg-muted/50 p-4 rounded-md border border-dashed mb-4">
                  <p className="text-sm text-muted-foreground text-center">No cover image set</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">Add photos to set a cover image</p>
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
                className="w-full sm:w-auto bg-luxury hover:bg-luxury/90"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Footer />
    </div>
  );
};

export default ListCar;

