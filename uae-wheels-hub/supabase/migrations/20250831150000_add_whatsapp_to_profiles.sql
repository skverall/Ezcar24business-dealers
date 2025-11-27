-- Add WhatsApp field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp text;

-- Add comment to describe the field
COMMENT ON COLUMN public.profiles.whatsapp IS 'WhatsApp phone number for direct messaging';

-- Update the handle_new_user function to include whatsapp field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, whatsapp)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'whatsapp'
  );
  RETURN NEW;
END;
$$;
