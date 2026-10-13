-- Create admin@mandir.local and yuvak@mandir.local in Supabase
-- Authentication first, then run this script to create their app profiles.
DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM auth.users
        WHERE email IN ('admin@mandir.local', 'yuvak@mandir.local')
    ) <> 2 THEN
        RAISE EXCEPTION
            'Create admin@mandir.local and yuvak@mandir.local in Supabase Authentication before running this script.';
    END IF;
END $$;

INSERT INTO public.profiles (id, name, email, role, is_active)
SELECT
    users.id,
    CASE users.email
        WHEN 'admin@mandir.local' THEN 'એડમિન સેવક'
        WHEN 'yuvak@mandir.local' THEN 'વર્કશોપ યુવક'
    END,
    users.email,
    CASE users.email
        WHEN 'admin@mandir.local' THEN 'admin'::user_role
        WHEN 'yuvak@mandir.local' THEN 'yuvak'::user_role
    END,
    true
FROM auth.users AS users
WHERE users.email IN ('admin@mandir.local', 'yuvak@mandir.local')
ON CONFLICT (id) DO NOTHING;
