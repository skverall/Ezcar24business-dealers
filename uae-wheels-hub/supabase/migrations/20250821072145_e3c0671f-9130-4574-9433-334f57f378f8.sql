-- Add missing company_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name text;