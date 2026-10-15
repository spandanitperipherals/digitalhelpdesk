import { google } from 'googleapis';
import { Readable } from 'stream';

export function extractFolderId(urlOrId: string): string {
  if (!urlOrId) return '';
  const clean = urlOrId.trim();
  const match = clean.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match && match[1] ? match[1] : clean;
}

// OAuth2 Client (આનાથી 0 Quota એરર ક્યારેય નહીં આવે)
function getDriveClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth Credentials (GMAIL_CLIENT_ID / SECRET / REFRESH_TOKEN) સેટ કરેલા નથી.');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

interface UploadOptions {
  folderUrl: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export async function uploadFileToSantFolder({
  folderUrl,
  fileName,
  fileBuffer,
  mimeType,
}: UploadOptions) {
  const drive = getDriveClient();
  const folderId = extractFolderId(folderUrl);

  if (!folderId) {
    throw new Error('માન્ય Google Drive Folder ID પ્રાપ્ત થયું નથી.');
  }

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: stream,
    },
    fields: 'id, name, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  const fileData = response.data;
  return {
    fileId: fileData.id || '',
    fileName: fileData.name || fileName,
    viewUrl: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    downloadUrl: fileData.webContentLink || '',
  };
}