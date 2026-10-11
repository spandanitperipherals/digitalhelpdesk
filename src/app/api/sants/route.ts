import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  // એડમિન ઓથ ચેક
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, mobile, shared_folder_link, niyam } = body;

  if (!name || !shared_folder_link) {
    return NextResponse.json(
      { error: 'Name and Google Drive Shared Folder Link are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('sants')
    .insert({
      name,
      email: email ? email.toLowerCase().trim() : null,
      mobile,
      shared_folder_link,
      niyam,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, sant: data });
}