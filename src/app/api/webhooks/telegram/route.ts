import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ૧. બ્રાઉઝરમાં સીધું ખોલતાં 405 ને બદલે 200 OK આપશે (Healthcheck)
export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    message: 'BAPS Telegram Webhook is actively running on Vercel!' 
  });
}

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const result = await res.json();
    if (!result.ok) {
      console.error('Telegram API error response:', result);
    }
  } catch (err) {
    console.error('Telegram fetch error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Incoming Telegram Payload:', JSON.stringify(body));

    // ૧. મેસેજ વિગત મેળવો
    const message = body?.message || body?.edited_message;
    if (!message) {
      return NextResponse.json({ ok: true, note: 'No message in update' });
    }

    const chatId = message.chat?.id?.toString();
    const senderUsername = message.from?.username || '';
    const senderName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || 'પૂજ્ય સંત / સેવક';
    const messageText = (message.text || message.caption || '').trim();

    if (!chatId) {
      return NextResponse.json({ ok: true, note: 'No chatId found' });
    }

    // ૨. બોટ ટોકન મેળવો (Vercel Env અથવા system_settings)
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      const { data: tokenSetting } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'telegram_bot_token')
        .maybeSingle();
      if (tokenSetting?.value) {
        botToken = tokenSetting.value;
      }
    }

    if (!botToken) {
      console.error('CRITICAL: TELEGRAM_BOT_TOKEN is missing!');
      return NextResponse.json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });
    }

    // ૩. /start કમાન્ડ માટે સ્પેશિયલ વેલકમ
    if (messageText === '/start') {
      const welcomeText = 
        `🙏 <b>જય સ્વામિનારાયણ</b>\n\n` +
        `BAPS અટલાદરા કોમ્પ્યુટર રૂમ હેલ્પડેસ્ક સેવામાં આપનું હાર્દિક સ્વાગત છે.\n\n` +
        `આપની કોઈપણ સેવા વિનંતી (ફાઇલ પ્રિન્ટ, ટાઇપિંગ, ડ્રાઇવ અપલોડ) અહીં મેસેજ સ્વરૂપે મોકલો. સિસ્ટમ આપમેળે નવી ટિકિટ જનરેટ કરશે.`;
      
      await sendTelegramMessage(botToken, chatId, welcomeText);
      return NextResponse.json({ ok: true, note: 'Sent welcome message' });
    }

    if (!messageText) {
      await sendTelegramMessage(botToken, chatId, 'કૃપા કરીને આપની વિનંતી ટેક્સ્ટ સ્વરૂપે લખીને મોકલો.');
      return NextResponse.json({ ok: true, note: 'Empty text' });
    }

    // ૪. ડેટાબેઝમાં સંત સાથે મેચ કરવાનો પ્રયાસ
    let santId: number | null = null;
    let displayName = senderName;

    const { data: sant } = await supabaseAdmin
      .from('sants')
      .select('id, name')
      .or(`telegram_chat_id.eq.${chatId},telegram_username.ilike.${senderUsername}`)
      .limit(1)
      .maybeSingle();

    if (sant) {
      santId = sant.id;
      displayName = sant.name;
    }

    // ૫. રેન્ડમ ટિકિટ ID
    const ticketSeq = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `BAPS-TG-${ticketSeq}`;

    // ૬. service_requests ટેબલમાં નવી ટિકિટ ઉમેરો
    const { error: insertError } = await supabaseAdmin
      .from('service_requests')
      .insert({
        ticket_id: ticketId,
        subject: messageText.length > 60 ? `${messageText.slice(0, 60)}...` : messageText,
        description: messageText,
        status: 'Pending',
        channel: 'Telegram',
        sant_id: santId,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Supabase Insert Error:', insertError);
      await sendTelegramMessage(
        botToken, 
        chatId, 
        `⚠️ વિનંતી નોંધવામાં ક્ષતિ થઈ: ${insertError.message}`
      );
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    // ૭. કન્ફર્મેશન રિપ્લાય મોકલો
    const replyText = 
      `🙏 <b>જય સ્વામિનારાયણ, ${displayName}</b>\n\n` +
      `આપની સેવા વિનંતી સફળતાપૂર્વક નોંધાઈ ગઈ છે.\n` +
      `📌 <b>ટિકિટ નંબર:</b> <code>${ticketId}</code>\n` +
      `⏳ <b>સ્થિતિ:</b> પેન્ડિંગ (કતારમાં મુકાયેલ)\n\n` +
      `યુવક સેવા ડેસ્ક દ્વારા ટૂંક સમયમાં કાર્યવાહી કરવામાં આવશે.`;

    await sendTelegramMessage(botToken, chatId, replyText);

    return NextResponse.json({ ok: true, ticket_id: ticketId });
  } catch (err: any) {
    console.error('Catch Error in Telegram Webhook:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}