import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// JWT પેલોડ ડીકોડ કરવા માટેનું હેલ્પર ફંક્શન
function parseJwt(token: string | undefined) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value, '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, '', ...options });
        },
      },
    }
  );

  // સુરક્ષિત યુઝર ઓથેન્ટિકેશન
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ૧. જો યુઝર લૉગિન ન હોય અને પ્રોટેક્ટેડ રૂટ એક્સેસ કરે
  if (!user && (path.startsWith('/admin') || path.startsWith('/yuvak'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // ૨. જો યુઝર લૉગિન હોય
  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Access Token Hook ના કસ્ટમ ક્લેમ્સ મેળવો
    const jwtPayload = parseJwt(session?.access_token);
    const role: string = jwtPayload?.user_role || (user as any)?.user_role || 'yuvak';
    const isActive: boolean = jwtPayload?.is_active ?? true;

    // જો એકાઉન્ટ નિષ્ક્રિય હોય
    if (!isActive && path !== '/login') {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'inactive');
      return NextResponse.redirect(url);
    }

    // જો નોન-એડમિન યુઝર એડમિન પેનલ એક્સેસ કરવાનો પ્રયત્ન કરે
    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/yuvak/queue';
      return NextResponse.redirect(url);
    }

    // જો લૉગિન થયેલો યુઝર ફરીથી /login પેજ ખોલે તો રીડાયરેક્ટ કરો
    if (path === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'admin' ? '/admin/sants' : '/yuvak/queue';
      return NextResponse.redirect(url);
    }
  }

  return response;
}