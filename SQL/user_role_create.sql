-- Profiles ટેબલમાં Admin અને Yuvak ના રોલ સેટ કરવા
INSERT INTO public.profiles (id, name, email, role, is_active)
SELECT id, 'એડમિન સેવક', email, 'admin'::user_role, true
FROM auth.users
WHERE email = 'admin@mandir.local'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role;

INSERT INTO public.profiles (id, name, email, role, is_active)
SELECT id, 'વર્કશોપ યુવક', email, 'yuvak'::user_role, true
FROM auth.users
WHERE email = 'yuvak@mandir.local'
ON CONFLICT (id) DO UPDATE SET role = 'yuvak'::user_role;