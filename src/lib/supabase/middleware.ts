import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // ૧. લોગિન વગર સુરક્ષિત રૂટ એક્સેસ કરવા પર રીડાયરેક્ટ
  if (!user && (path.startsWith('/admin') || path.startsWith('/yuvak'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // ૨. રોલ-બેઝ્ડ રીડાયરેક્શન
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profile && !profile.is_active && path !== '/login') {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'inactive');
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/admin') && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/yuvak/queue';
      return NextResponse.redirect(url);
    }

    if (path === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === 'admin' ? '/admin/sants' : '/yuvak/queue';
      return NextResponse.redirect(url);
    }
  }

  return response;
}