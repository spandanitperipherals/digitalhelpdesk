import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const { amendment_type, notes, attachment_urls } = await req.json();

    // ૧. રિક્વેસ્ટ અસ્તિત્વમાં છે કે નહીં તે ચકાસવું
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('service_requests')
      .select('id, status')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // ૨. જો Sant Self-Close કરતો હોય
    if (amendment_type === 'cancel') {
      await supabaseAdmin
        .from('service_requests')
        .update({ status: 'Closed_by_Sant', updated_at: new Date().toISOString() })
        .eq('id', requestId);
    }

    // ૩. સુધારો લોગ કરવો
    const { data: amendment, error: amdErr } = await supabaseAdmin
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