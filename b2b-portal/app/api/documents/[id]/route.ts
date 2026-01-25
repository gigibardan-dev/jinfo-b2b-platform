import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteDocument, getSignedDocumentUrl } from '@/lib/services/documents';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteDocument(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: document } = await supabase
      .from('booking_documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const signedUrl = await getSignedDocumentUrl(document.file_path);
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting document URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
