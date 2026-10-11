import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadFileToSantFolder } from '@/lib/google-drive';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await context.params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const yuvakId = formData.get('yuvak_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'દસ્તાવેજ ફાઇલ પસંદ કરવી જરૂરી છે.' }, { status: 400 });
    }

    // ૧. રિક્વેસ્ટ અને સંબંધિત સંતની ફોલ્ડર લિંક મેળવવી
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('service_requests')
      .select('id, ticket_id, sant_id, sants(name, shared_folder_link)')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      return NextResponse.json({ error: 'સર્વિસ રિક્વેસ્ટ મળી નથી.' }, { status: 404 });
    }

    const sant = (request as any).sants;
    if (!sant?.shared_folder_link) {
      return NextResponse.json(
        { error: 'સંતના એકાઉન્ટમાં Google Drive Shared Folder Link મેપ કરેલ નથી.' },
        { status: 400 }
      );
    }

    // ૨. ફાઇલને બફરમાં રૂપાંતર કરી Drive પર અપલોડ કરવી
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadFileToSantFolder({
      folderUrl: sant.shared_folder_link,
      fileName: file.name,
      fileBuffer: buffer,
      mimeType: file.type,
    });

    // ૩. Documents ટેબલમાં એન્ટ્રી કરવી
    await supabaseAdmin.from('documents').insert({
      request_id: request.id,
      file_name: uploadResult.fileName,
      file_url: uploadResult.viewUrl,
      uploaded_by: yuvakId || null,
    });

    // ૪. રિક્વેસ્ટને Completed માર્ક કરવી
    await supabaseAdmin
      .from('service_requests')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    return NextResponse.json({
      success: true,
      message: 'કાર્ય સફળતાપૂર્વક પૂર્ણ થયું અને ફાઇલ સંતના ફોલ્ડરમાં સેવ થઈ.',
      viewUrl: uploadResult.viewUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}