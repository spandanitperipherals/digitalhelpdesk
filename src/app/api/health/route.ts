import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
      return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: 'connected', data });
  } catch (err: any) {
    return NextResponse.json({ status: 'exception', error: err.message }, { status: 500 });
  }
}