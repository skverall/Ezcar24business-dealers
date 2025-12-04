-- Seed admin user and whitelist for reports

INSERT INTO public.admin_users (
  username,
  password_hash,
  role,
  full_name,
  email,
  is_active,
  password_change_required
) VALUES (
  'aydmaxx@gmail.com',
  public.hash_password('Temp#Aydmaxx2024!'),
  'super_admin',
  'Aydmaxx Admin',
  'aydmaxx@gmail.com',
  true,
  true
)
ON CONFLICT (username) DO UPDATE
  SET role = EXCLUDED.role,
      is_active = true,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      password_change_required = true;

-- Whitelist the given Supabase auth user for reports and ensure author row
INSERT INTO public.report_author_whitelist (user_id, added_by, note)
VALUES ('33074802-ba98-4373-a268-071983939e2b', NULL, 'whitelisted admin')
ON CONFLICT (user_id) DO UPDATE
  SET note = EXCLUDED.note;

INSERT INTO public.report_authors (user_id, full_name, role, contact_email, contact_phone)
VALUES ('33074802-ba98-4373-a268-071983939e2b', 'Aydmaxx Admin', 'inspector', 'aydmaxx@gmail.com', NULL)
ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      contact_email = EXCLUDED.contact_email,
      updated_at = now();
