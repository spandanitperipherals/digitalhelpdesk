import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    // Vercel Cron સુરક્ષા ચકાસણી (વૈકલ્પિક પણ સુરક્ષિત)
    const authHeader = req.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json(
        { error: 'GOOGLE_CLOUD_PROJECT_ID is not configured' },
        { status: 500 }
      );
    }

    // Gmail Watch ટ્રિગર કરવું
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: `projects/${projectId}/topics/gmail-incoming-tickets`,
        labelIds: ['INBOX'],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gmail watch successfully registered/renewed',
      historyId: response.data.historyId,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('Gmail Watch Cron Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to trigger gmail watch' },
      { status: 500 }
    );
  }
}