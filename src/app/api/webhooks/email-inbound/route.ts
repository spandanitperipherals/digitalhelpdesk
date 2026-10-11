import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client bypasses RLS for automated background webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, subject, text, messageId, attachments } = body;

    // ૧. મોકલનાર ઈમેલ પરથી સંતની વિગત મેળવવી
    const senderEmail = from.toLowerCase().trim();
    const { data: sant, error: santErr } = await supabaseAdmin
      .from('sants')
      .select('id, name, shared_folder_link')
      .eq('email', senderEmail)
      .single();

    if (santErr || !sant) {
      return NextResponse.json(
        { error: 'Unregistered sender email' },
        { status: 403 }
      );
    }

    // ૨. ચકાસણી: શું આ ઈમેલ હાલની ટિકિટ (દા.ત. SR-1024) નો રિપ્લાય/અમેન્ડમેન્ટ છે?
    const ticketMatch = subject.match(/SR-(\d+)/i);

    if (ticketMatch) {
      const ticketId = ticketMatch[0].toUpperCase();
      const { data: request } = await supabaseAdmin
        .from('service_requests')
        .select('id, status')
        .eq('ticket_id', ticketId)
        .single();

      if (request && request.status !== 'Completed') {
        // જો સંત "CLOSE" લખીને મોકલે તો સેલ્ફ-ક્લોઝ કરવું
        if (text.toLowerCase().includes('close')) {
          await supabaseAdmin
            .from('service_requests')
            .update({ status: 'Closed_by_Sant', updated_at: new Date().toISOString() })
            .eq('id', request.id);

          await supabaseAdmin.from('request_amendments').insert({
            request_id: request.id,
            type: 'cancel',
            notes: 'Closed by Sant via Email reply',
          });

          return NextResponse.json({ message: 'Request closed by Sant' });
        }

        // અન્યથા સુધારો/વધારાની ફાઇલો જોડવી (Amendment)
        await supabaseAdmin.from('request_amendments').insert({
          request_id: request.id,
          type: attachments?.length ? 'add_doc' : 'modify',
          notes: text,
          attachment_urls: attachments || [],
        });

        await supabaseAdmin
          .from('service_requests')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', request.id);

        return NextResponse.json({ message: 'Amendment recorded successfully' });
      }
    }

    // ૩. જો નવો ઈમેલ હોય તો નવી સર્વિસ રિક્વેસ્ટ બનાવવી
    const { data: newRequest, error: reqErr } = await supabaseAdmin
      .from('service_requests')
      .insert({
        sant_id: sant.id,
        channel: 'Email',
        subject: subject || 'No Subject',
        description: text || '',
        source_email_message_id: messageId,
        status: 'Pending',
      })
      .select()
      .single();

    if (reqErr) throw reqErr;

    return NextResponse.json({
      success: true,
      ticket_id: newRequest.ticket_id,
      message: 'Service request created',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}