import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Telegram પર મેસેજ મોકલવા માટેનું હેલ્પર ફંક્શન
async function sendTelegramMessage(chatId: number | string, text: string) {
  await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // જો સામાન્ય ટેક્સ્ટ મેસેજ ન હોય તો ઇગ્નોર કરવો
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const telegramUsername = update.message.from.username;

    // ૧. ટેલિગ્રામ કોન્ટેક્ટ અથવા ઓથેન્ટિકેશન વેરિફિકેશન
    // અહીં સંતના રજિસ્ટર્ડ મોબાઈલ/ઈમેલ સાથે સંતની ઓળખ થશે
    const { data: sant, error: santErr } = await supabaseAdmin
      .from('sants')
      .select('id, name, shared_folder_link')
      .eq('is_active', true)
      .limit(1)
      .single(); // પ્રોડક્શનમાં sant_auth માંથી chatId સાથે લિંક કરેલ સંત લેવો

    if (santErr || !sant) {
      await sendTelegramMessage(
        chatId,
        'જય સ્વામિનારાયણ 🙏\nઆપનો નંબર સિસ્ટમમાં રજિસ્ટર્ડ નથી. કૃપા કરીને આઈ.ટી. એડમિનનો સંપર્ક કરો.'
      );
      return NextResponse.json({ ok: true });
    }

    // ૨. અમેન્ડમેન્ટ અથવા સેલ્ફ-ક્લોઝર ચેક (દા.ત. SR-1001 લખેલું હોય)
    const ticketMatch = text.match(/SR-(\d+)/i);

    if (ticketMatch) {
      const ticketId = ticketMatch[0].toUpperCase();
      const { data: request } = await supabaseAdmin
        .from('service_requests')
        .select('id, status')
        .eq('ticket_id', ticketId)
        .single();

      if (request && request.status !== 'Completed') {
        // જો મેસેજમાં "CLOSE" અથવા "રદ" લખેલું હોય
        if (text.toLowerCase().includes('close') || text.includes('રદ')) {
          await supabaseAdmin
            .from('service_requests')
            .update({ status: 'Closed_by_Sant', updated_at: new Date().toISOString() })
            .eq('id', request.id);

          await supabaseAdmin.from('request_amendments').insert({
            request_id: request.id,
            type: 'cancel',
            notes: 'Closed by Sant via Telegram',
          });

          await sendTelegramMessage(
            chatId,
            `જય સ્વામિનારાયણ 🙏\n\nઆપની સેવા વિનંતી <b>${ticketId}</b> આપના નિર્દેશ મુજબ બંધ (Closed) કરવામાં આવી છે.`
          );
          return NextResponse.json({ ok: true });
        }

        // અન્યથા વધારાની સૂચના ઉમેરવી (Amendment)
        await supabaseAdmin.from('request_amendments').insert({
          request_id: request.id,
          type: 'modify',
          notes: text,
        });

        await supabaseAdmin
          .from('service_requests')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', request.id);

        await sendTelegramMessage(
          chatId,
          `જય સ્વામિનારાયણ 🙏\n\nઆપની વિનંતી <b>${ticketId}</b> માં નવી સૂચના સફળતાપૂર્વક ઉમેરી દેવામાં આવી છે.`
        );
        return NextResponse.json({ ok: true });
      }
    }

    // ૩. નવી સર્વિસ રિક્વેસ્ટ બનાવવી
    const { data: newRequest, error: reqErr } = await supabaseAdmin
      .from('service_requests')
      .insert({
        sant_id: sant.id,
        channel: 'Telegram',
        subject: text.slice(0, 40) + '...',
        description: text,
        status: 'Pending',
      })
      .select()
      .single();

    if (reqErr) throw reqErr;

    // સંતને સ્વીકૃતિ મેસેજ (Acknowledgement) મોકલવો
    await sendTelegramMessage(
      chatId,
      `જય સ્વામિનારાયણ ${sant.name} 🙏\n\nઆપની સેવા વિનંતી નોંધાઈ ગઈ છે.\n<b>ટિકિટ નંબર: ${newRequest.ticket_id}</b>\n\nયુવક દ્વારા કાર્ય શરૂ થતાં જ આપને અપડેટ મળશે.`
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}