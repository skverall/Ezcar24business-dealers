-- EMERGENCY ADMIN PASSWORD RESET
-- Execute this in Supabase SQL Editor if you're locked out

-- Method 1: Reset to default secure password
SELECT public.emergency_reset_admin_password('admin', 'EzCar24Admin2025!');

-- Method 2: Manual reset (if function doesn't work)
UPDATE public.admin_users 
SET password_hash = public.hash_password('EzCar24Admin2025!'),
    password_changed_at = now(),
    password_change_required = false,
    failed_login_attempts = 0,
    locked_until = NULL,
    is_active = true,
    updated_at = now()
WHERE username = 'admin';

-- Clear all admin sessions to force re-login
DELETE FROM public.admin_sessions;

-- Verify the admin user exists and is active
SELECT 
  username, 
  role, 
  is_active, 
  failed_login_attempts, 
  locked_until,
  last_login_at,
  password_changed_at
FROM public.admin_users 
WHERE username IN ('admin', 'superadmin');

-- Test password verification (should return true)
SELECT public.verify_password('EzCar24Admin2025!', password_hash) as password_valid
FROM public.admin_users 
WHERE username = 'admin';

/*
CREDENTIALS AFTER RESET:
========================
Username: admin
Password: EzCar24Admin2025!

Alternative:
Username: superadmin  
Password: SuperAdmin2025!

IMPORTANT: Change these passwords immediately after login!
*/
