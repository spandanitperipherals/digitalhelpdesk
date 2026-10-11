import { google } from 'googleapis';
import { Readable } from 'stream';

// ૧. Google Drive Service Account ક્લાયન્ટ પ્રમાણીકરણ
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDriveClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Google Drive Service Account Credentials not configured.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Shared Folder URL માંથી Google Drive Folder ID અલગ તારવે છે
 * દા.ત. https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP... -> 1aBcDeFgHiJkLmNoP...
 */
export function extractFolderId(folderUrl: string): string | null {
  if (!folderUrl) return null;
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  // જો વપરાશકર્તાએ સીધો ફોલ્ડર આઈડી જ આપ્યો હોય
  if (/^[a-zA-Z0-9_-]{20,}$/.test(folderUrl.trim())) return folderUrl.trim();
  return null;
}

/**
 * પૂજ્ય સંતના મેપ થયેલા Google Drive ફોલ્ડરમાં સીધી ફાઇલ અપલોડ કરે છે
 */
export async function uploadFileToSantFolder({
  folderUrl,
  fileName,
  fileBuffer,
  mimeType,
}: {
  folderUrl: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}) {
  const drive = getDriveClient();
  const folderId = extractFolderId(folderUrl);

  if (!folderId) {
    throw new Error('અમાન્ય Google Drive Shared Folder લિંક.');
  }

  // Buffer ને Readable Stream માં રૂપાંતરિત કરવું
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: stream,
  };

  // Google Drive પર ફાઇલ અપલોડ
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink',
  });

  return {
    fileId: response.data.id,
    fileName: response.data.name,
    viewUrl: response.data.webViewLink,
  };
}