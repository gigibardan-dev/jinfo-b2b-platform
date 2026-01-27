import { createClient } from '@/lib/supabase/server';
import type { BookingDocument, DocumentType } from '@/lib/types/document';

export async function getBookingDocuments(bookingId: string): Promise<BookingDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('booking_documents')
    .select('*')
    .eq('pre_booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Map to expected format
  return (data || []).map(d => ({
    ...d,
    booking_id: d.pre_booking_id,
    file_path: d.file_url,
    uploaded_at: d.created_at,
    notes: d.upload_notes
  }));
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

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('booking-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('booking-documents')
    .getPublicUrl(fileName);

  // Insert record in database
  const { data, error } = await supabase
    .from('booking_documents')
    .insert({
      pre_booking_id: bookingId,
      document_type: documentType,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
      upload_notes: notes,
      visible_to_agency: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  // Map to expected format
  return {
    ...data,
    booking_id: data.pre_booking_id,
    file_path: data.file_url,
    uploaded_at: data.created_at,
    notes: data.upload_notes
  };
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = await createClient();

  // Get document info
  const { data: document } = await supabase
    .from('booking_documents')
    .select('file_url')
    .eq('id', documentId)
    .single();

  if (document && document.file_url) {
    // Extract file path from URL
    const urlParts = document.file_url.split('/');
    const bucketIndex = urlParts.indexOf('booking-documents');
    if (bucketIndex !== -1) {
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      // Delete from storage
      await supabase.storage
        .from('booking-documents')
        .remove([filePath]);
    }
  }

  // Delete record from database
  const { error } = await supabase
    .from('booking_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

export async function getDocumentUrl(fileUrl: string): Promise<string> {
  // File URL is already public, just return it
  return fileUrl;
}

export async function getSignedDocumentUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
  const supabase = await createClient();

  // Extract file path from URL
  const urlParts = fileUrl.split('/');
  const bucketIndex = urlParts.indexOf('booking-documents');
  
  if (bucketIndex === -1) {
    return fileUrl; // Return original if can't parse
  }

  const filePath = urlParts.slice(bucketIndex + 1).join('/');

  const { data, error } = await supabase.storage
    .from('booking-documents')
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
