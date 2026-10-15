'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSystemSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value');

  if (error) {
    return { error: error.message };
  }

  const settingsMap: Record<string, string> = {};
  data.forEach((item) => {
    settingsMap[item.key] = item.value;
  });

  return { settings: settingsMap };
}

export async function updateSystemSettings(formData: {
  supportEmail: string;
  serviceAccountJson?: string;
}) {
  const supabase = await createClient();

  // 1. Verify caller is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can modify system integrations.' };
  }

  // 2. Update incoming email
  const updates: { key: string; value: string; updated_at: string }[] = [
    {
      key: 'support_ticket_email',
      value: formData.supportEmail.trim().toLowerCase(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 3. Optional: Parse Google Service Account JSON if provided
  if (formData.serviceAccountJson?.trim()) {
    try {
      const parsed = JSON.parse(formData.serviceAccountJson.trim());
      if (!parsed.client_email || !parsed.private_key) {
        return { error: 'Invalid Google JSON: missing client_email or private_key' };
      }
      updates.push(
        {
          key: 'google_service_account_email',
          value: parsed.client_email,
          updated_at: new Date().toISOString(),
        },
        {
          key: 'google_service_account_key',
          value: parsed.private_key,
          updated_at: new Date().toISOString(),
        }
      );
    } catch {
      return { error: 'Google Service Account credentials must be valid JSON.' };
    }
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert(updates);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}