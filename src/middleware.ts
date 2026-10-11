import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * નીચેના રૂટ્સ સિવાયના તમામ પાથ પર મિડલવેર ચાલશે:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (Telegram & Email Inbound APIs જેને પબ્લિક રાખવાના છે)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};