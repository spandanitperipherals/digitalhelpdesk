'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string;

  const supabase = await createClient();

  // ૧. Supabase Auth માં લોગિન
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    console.error("Supabase Login Auth Error:", error.message, error.status);
    return { error: error.message };
  }

  // ૨. યુઝરનો રોલ અને સ્થિતિ તપાસવી
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: 'આપનું એકાઉન્ટ નિષ્ક્રિય છે. કૃપા કરીને એડમિનનો સંપર્ક કરો.' };
  }

  // ૩. રીડાયરેક્ટ પાથ નક્કી કરવો
  let targetPath = profile.role === 'admin' ? '/admin/sants' : '/yuvak/queue';
  if (redirectTo && redirectTo.startsWith('/')) {
    targetPath = redirectTo;
  }

  redirect(targetPath);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}