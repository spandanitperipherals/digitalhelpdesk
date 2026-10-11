const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendCompletionNotification({
  chatId,
  santName,
  ticketId,
  fileName,
  driveLink,
}: {
  chatId?: string | number;
  santName: string;
  ticketId: string;
  fileName: string;
  driveLink: string;
}) {
  if (!chatId || !TELEGRAM_BOT_TOKEN) return;

  const message = `જય સ્વામિનારાયણ ${santName} 🙏\n\nઆપની સેવા વિનંતી <b>${ticketId}</b> સફળતાપૂર્વક સંપન્ન થયેલ છે.\n\n📄 <b>ફાઇલ:</b> ${fileName}\n📁 <b>Google Drive લિંક:</b> <a href="${driveLink}">અહીં ક્લિક કરીને ફાઇલ જુઓ</a>\n\nઆપના શેર ફોલ્ડરમાં આ ફાઇલ સુરક્ષિત રીતે જમા થઈ ગઈ છે.`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Notification dispatch failed:', err);
  }
}