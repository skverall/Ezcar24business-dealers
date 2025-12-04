-- Ensure Supabase auth user gets admin role for app RLS checks

INSERT INTO public.user_roles (user_id, role)
VALUES ('33074802-ba98-4373-a268-071983939e2b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
