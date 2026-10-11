CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_uid UUID := gen_random_uuid();
    yuvak_uid UUID := gen_random_uuid();
BEGIN
    -- ૧. Admin યુઝર બનાવવો
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@mandir.local') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        ) VALUES (
            admin_uid,
            '00000000-0000-0000-0000-000000000000',
            'admin@mandir.local',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Admin"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        );

        INSERT INTO public.profiles (id, name, email, role, is_active)
        VALUES (admin_uid, 'એડમિન સેવક', 'admin@mandir.local', 'admin', true)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- ૨. Yuvak યુઝર બનાવવો
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'yuvak@mandir.local') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        ) VALUES (
            yuvak_uid,
            '00000000-0000-0000-0000-000000000000',
            'yuvak@mandir.local',
            crypt('yuvak123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Yuvak"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        );

        INSERT INTO public.profiles (id, name, email, role, is_active)
        VALUES (yuvak_uid, 'વર્કશોપ યુવક', 'yuvak@mandir.local', 'yuvak', true)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;