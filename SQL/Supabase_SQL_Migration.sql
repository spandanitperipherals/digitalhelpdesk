-- ========================================================
-- 1. EXTENSIONS & ENUMS
-- ========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'yuvak');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('Pending', 'In-Progress', 'Closed_by_Sant', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE request_channel AS ENUM ('Email', 'Telegram', 'WhatsApp');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE amendment_type AS ENUM ('modify', 'add_doc', 'cancel');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ========================================================
-- 2. TABLES CREATION
-- ========================================================

-- (A) પૂજ્ય સંતોનું માસ્ટર ટેબલ (Google Drive Shared Folder Link સહિત)
CREATE TABLE IF NOT EXISTS public.sants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    shared_folder_link TEXT NOT NULL,
    niyam TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- (B) યુવક અને એડમિન પ્રોફાઇલ (Supabase auth.users સાથે સંકળાયેલ)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role DEFAULT 'yuvak',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- (C) સંત ઓથેન્ટિકેશન લોગ (OTP Verification)
CREATE TABLE IF NOT EXISTS public.sant_auth (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sant_id BIGINT REFERENCES public.sants(id) ON DELETE CASCADE,
    email VARCHAR(255),
    mobile VARCHAR(20),
    otp_hash TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- (D) સર્વિસ રિક્વેસ્ટ ટેબલ (સ્વચાલિત SR- ટિકિટ આઈડી સાથે)
CREATE TABLE IF NOT EXISTS public.service_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id TEXT GENERATED ALWAYS AS ('SR-' || (1000 + id)::text) STORED,
    sant_id BIGINT NOT NULL REFERENCES public.sants(id) ON DELETE RESTRICT,
    assigned_yuvak_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel request_channel NOT NULL,
    subject VARCHAR(255),
    description TEXT NOT NULL,
    status request_status DEFAULT 'Pending',
    source_email_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMPTZ
);

-- (E) અમેન્ડમેન્ટ્સ અને અપડેટ્સ (Amendments / New Docs / Self-Closure)
CREATE TABLE IF NOT EXISTS public.request_amendments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    type amendment_type NOT NULL,
    notes TEXT,
    attachment_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- (F) અપલોડ થયેલા દસ્તાવેજો (Google Drive Sync Metadata)
CREATE TABLE IF NOT EXISTS public.documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    drive_folder_id TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ========================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.sants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sant_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- રોલ ચેક માટે હેલ્પર ફંક્શન્સ
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_yuvak()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'yuvak') AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (A) Profiles Policies
DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;
CREATE POLICY "Admins have full access on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- (B) Sants Policies
DROP POLICY IF EXISTS "Admins have full access on sants" ON public.sants;
CREATE POLICY "Admins have full access on sants"
    ON public.sants FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Yuvaks can read sant list" ON public.sants;
CREATE POLICY "Yuvaks can read sant list"
    ON public.sants FOR SELECT
    USING (public.is_yuvak());

-- (C) Service Requests Policies
DROP POLICY IF EXISTS "Admins have full access on requests" ON public.service_requests;
CREATE POLICY "Admins have full access on requests"
    ON public.service_requests FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Yuvaks can view active requests" ON public.service_requests;
CREATE POLICY "Yuvaks can view active requests"
    ON public.service_requests FOR SELECT
    USING (public.is_yuvak());

DROP POLICY IF EXISTS "Yuvaks can update assigned or pending requests" ON public.service_requests;
CREATE POLICY "Yuvaks can update assigned or pending requests"
    ON public.service_requests FOR UPDATE
    USING (public.is_yuvak())
    WITH CHECK (public.is_yuvak());

-- (D) Request Amendments Policies
DROP POLICY IF EXISTS "Yuvaks and Admins can view amendments" ON public.request_amendments;
CREATE POLICY "Yuvaks and Admins can view amendments"
    ON public.request_amendments FOR SELECT
    USING (public.is_yuvak());

-- (E) Documents Policies
DROP POLICY IF EXISTS "Authenticated users can view docs" ON public.documents;
CREATE POLICY "Authenticated users can view docs"
    ON public.documents FOR SELECT
    USING (public.is_yuvak());

DROP POLICY IF EXISTS "Yuvaks can insert completed docs" ON public.documents;
CREATE POLICY "Yuvaks can insert completed docs"
    ON public.documents FOR INSERT
    WITH CHECK (public.is_yuvak());