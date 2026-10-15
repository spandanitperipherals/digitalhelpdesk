import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Pub/Sub સંદેશો ડીકોડ કરવો
    if (!body?.message?.data) {
      return NextResponse.json({ ok: true });
    }

    // તાજેતરના મેસેજનું લિસ્ટ મેળવવું
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const latestMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messages[0].id!,
    });

    const headers = latestMessage.data.payload?.headers || [];
    const fromHeader = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || 'ઈમેલ દ્વારા નવી વિનંતી';
    const snippet = latestMessage.data.snippet || '';

    // ઈમેલ મોકલનાર સંતને ડેટાબેઝમાં મેચ કરો
    const fromEmail = fromHeader.match(/<([^>]+)>/)?.[1] || fromHeader;
    const { data: sant } = await supabaseAdmin
      .from('sants')
      .select('id')
      .ilike('email', fromEmail)
      .maybeSingle();

    // નવી ટિકિટ જનરેટ કરવી
    const ticketSeq = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `BAPS-EM-${ticketSeq}`;

    await supabaseAdmin.from('service_requests').insert({
      ticket_id: ticketId,
      subject: subject,
      description: snippet,
      status: 'Pending',
      channel: 'Email',
      sant_id: sant?.id || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, ticket_id: ticketId });
  } catch (error: any) {
    console.error('Gmail Webhook Error:', error);
    return NextResponse.json({ ok: true }); // લૂપ અટકાવવા 200 રિસ્પોન્સ
  }
}