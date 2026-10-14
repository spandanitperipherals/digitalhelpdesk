import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: requestId } = await context.params;
    const { amendment_type, notes, attachment_urls } = await req.json();

    // ૧. રિક્વેસ્ટ અસ્તિત્વમાં છે કે નહીં તે ચકાસવું
    const { data: request, error: reqErr } = await supabase
      .from('service_requests')
      .select('id, status')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // ૨. જો Sant Self-Close કરતો હોય
    if (amendment_type === 'cancel') {
      await supabase
        .from('service_requests')
        .update({ status: 'Closed_by_Sant', updated_at: new Date().toISOString() })
        .eq('id', requestId);
    }

    // ૩. સુધારો લોગ કરવો
    const { data: amendment, error: amdErr } = await supabase
      .from('request_amendments')
      .insert({
        request_id: requestId,
        type: amendment_type,
        notes,
        attachment_urls: attachment_urls || [],
      })
      .select()
      .single();

    if (amdErr) throw amdErr;

    return NextResponse.json({ success: true, amendment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}