// app/api/cruise-documents/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCruiseBookingDocuments, uploadCruiseDocument } from '@/lib/services/cruise-documents';
import type { DocumentType } from '@/lib/types/document';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    if (!bookingId) return NextResponse.json({ error: 'booking_id required' }, { status: 400 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'operator';
    const documents = await getCruiseBookingDocuments(bookingId, !isAdmin);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching cruise documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((['admin', 'superadmin'].includes(profile?.role ?? '')) === false && profile?.role !== 'superadmin' && profile?.role !== 'operator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file        = formData.get('file') as File;
    const bookingId   = formData.get('booking_id') as string;
    const documentType = formData.get('document_type') as DocumentType;
    const notes       = formData.get('notes') as string | undefined;

    if (!file || !bookingId || !documentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const document = await uploadCruiseDocument(bookingId, file, documentType, user.id, notes);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading cruise document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}