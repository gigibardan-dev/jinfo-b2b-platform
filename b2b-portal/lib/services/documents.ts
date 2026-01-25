import { createClient } from '@/lib/supabase/server';
import type { BookingDocument, DocumentType } from '@/lib/types/document';

export async function getBookingDocuments(bookingId: string): Promise<BookingDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('booking_documents')
    .select('*')
    .eq('booking_id', bookingId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadDocument(
  bookingId: string,
  file: File,
  documentType: DocumentType,
  userId: string,
  notes?: string
): Promise<BookingDocument> {
  const supabase = await createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${bookingId}/${Date.now()}_${documentType}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('booking-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('booking_documents')
    .insert({
      booking_id: bookingId,
      document_type: documentType,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
      notes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = await createClient();

  const { data: document } = await supabase
    .from('booking_documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (document) {
    await supabase.storage
      .from('booking-documents')
      .remove([document.file_path]);
  }

  const { error } = await supabase
    .from('booking_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  const supabase = await createClient();

  const { data } = supabase.storage
    .from('booking-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getSignedDocumentUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('booking-documents')
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
