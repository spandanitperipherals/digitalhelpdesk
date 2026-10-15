import { google } from 'googleapis';
import { Readable } from 'stream';

// ૧. Google Drive Shared Folder URL અથવા Link માંથી Folder ID મેળવવું
export function extractFolderId(urlOrId: string): string {
  if (!urlOrId) return '';
  const clean = urlOrId.trim();
  // https://drive.google.com/drive/folders/1ABCxyz... ફોર્મેટમાંથી ID અલગ કરવું
  const match = clean.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // જો સીધું ID જ નાખેલું હોય
  return clean;
}

// ૨. Google Auth Client તૈયાર કરવું
function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive Service Account ક્રેડેન્શિયલ્સ (Email / Private Key) સેટ કરેલા નથી.');
  }

  // Vercel માં \n એસ્કેપ સ્ટ્રિંગને સાચી નવી લાઈનમાં ફેરવવી
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

interface UploadOptions {
  folderUrl: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

// ૩. સંતના Google Drive Folder માં ફાઇલ અપલોડ કરવી
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

  // Buffer ને Readable Stream માં રૂપાંતરિત કરવું
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  // Drive API દ્વારા ફાઇલ ક્રિએટ કરવી (parents & supportsAllDrives સાથે)
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId], // આના કારણે ફાઈલ સીધી સંતના શેર કરેલા ફોલ્ડરમાં જશે
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: stream,
    },
    fields: 'id, name, webViewLink, webContentLink',
    supportsAllDrives: true, // Shared Drive / Shared Folder માટે ફરજિયાત
  });

  const fileData = response.data;

  return {
    fileId: fileData.id || '',
    fileName: fileData.name || fileName,
    viewUrl: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    downloadUrl: fileData.webContentLink || '',
  };
}