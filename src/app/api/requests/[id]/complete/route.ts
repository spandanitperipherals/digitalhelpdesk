import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadFileToSantFolder } from '@/lib/google-drive';

// Vercel સર્વરલેસ એક્ઝિક્યુશન ટાઇમઆઉટ અને ડાયનેમિક કન્ફિગરેશન
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: requestId } = await context.params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const yuvakId = (formData.get('yuvak_id') as string) || null;

    if (!file) {
      return NextResponse.json(
        { error: 'દસ્તાવેજ ફાઇલ પસંદ કરવી જરૂરી છે.' },
        { status: 400 }
      );
    }

    // ૧. રિક્વેસ્ટ અને સંબંધિત સંતની માહિતી મેળવવી
    const { data: request, error: reqErr } = await supabase
      .from('service_requests')
      .select('id, ticket_id, sant_id, sants(name, shared_folder_link)')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      return NextResponse.json(
        { error: 'સર્વિસ રિક્વેસ્ટ રેકોર્ડ મળ્યો નથી.' },
        { status: 404 }
      );
    }

    const sant = (request as any)?.sants;
    if (!sant?.shared_folder_link) {
      return NextResponse.json(
        { error: 'પૂજ્ય સંતના એકાઉન્ટમાં Google Drive Shared Folder Link મેપ કરેલ નથી.' },
        { status: 400 }
      );
    }

    // ૨. ફાઇલને બફરમાં રૂપાંતર કરી Google Drive પર સંતના ફોલ્ડરમાં અપલોડ કરવી
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadFileToSantFolder({
      folderUrl: sant.shared_folder_link,
      fileName: file.name,
      fileBuffer: buffer,
      mimeType: file.type,
    });

    // ૩. Documents ટેબલમાં અપલોડ કરેલ ફાઇલની નોંધ કરવી
    const { error: docErr } = await supabase.from('documents').insert({
      request_id: request.id,
      file_name: uploadResult.fileName,
      file_url: uploadResult.viewUrl,
      uploaded_by: yuvakId,
      created_at: new Date().toISOString(),
    });

    if (docErr) {
      console.warn('Documents table insert warning:', docErr.message);
    }

    // ૪. રિક્વેસ્ટનું સ્ટેટસ 'Completed' તરીકે અપડેટ કરવું
    const { error: updateErr } = await supabase
      .from('service_requests')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    if (updateErr) {
      console.error('Service request status update error:', updateErr.message);
      return NextResponse.json(
        { error: `સ્ટેટસ અપડેટ કરવામાં ક્ષતિ: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'કાર્ય સફળતાપૂર્વક પૂર્ણ થયું અને ફાઇલ સંતના ફોલ્ડરમાં સેવ થઈ.',
      viewUrl: uploadResult.viewUrl,
      fileName: uploadResult.fileName,
    });
  } catch (err: any) {
    console.error('Task complete handler error:', err);
    return NextResponse.json(
      { error: err?.message || 'ફાઇલ અપલોડ અથવા કાર્ય પૂર્ણ કરવામાં સર્વર ક્ષતિ આવી.' },
      { status: 500 }
    );
  }
}