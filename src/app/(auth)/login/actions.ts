'use server';

export const runtime = 'nodejs';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('CRITICAL: Supabase environment variables are missing from Vercel runtime!');
    return { error: 'સર્વર કનેક્શન સેટિંગ્સ ઉપલબ્ધ નથી (Missing Env Vars).' };
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    console.error('Supabase Login Auth Error:', error?.message);
    return { error: error?.message || 'ઈમેલ અથવા પાસવર્ડ અમાન્ય છે.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    console.error('Profile check error:', profileError?.message);
    await supabase.auth.signOut();
    return { error: 'આપનું એકાઉન્ટ નિષ્ક્રિય છે અથવા પ્રોફાઇલ મળેલ નથી.' };
  }

  let targetPath = profile.role === 'admin' ? '/admin/sants' : '/yuvak/queue';
  if (redirectTo && redirectTo.startsWith('/')) {
    targetPath = redirectTo;
  }

  redirect(targetPath);
}