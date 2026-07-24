// lib/services/cruise-documents.ts
import { createClient } from '@/lib/supabase/server';
import type { DocumentType } from '@/lib/types/document';

export interface CruiseDocument {
  id: string;
  cruise_booking_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  upload_notes: string | null;
  visible_to_agency: boolean;
  created_at: string;
  // câmpuri mapate pentru compatibilitate cu DocumentsList
  uploaded_at: string;
  notes: string | null;
  file_path: string;
  booking_id: string;
}

export async function getCruiseBookingDocuments(
  cruiseBookingId: string,
  onlyVisible = false
): Promise<CruiseDocument[]> {
  const supabase = await createClient();
  let query = supabase
    .from('booking_documents')
    .select('*')
    .eq('cruise_booking_id', cruiseBookingId)
    .order('created_at', { ascending: false });
  if (onlyVisible) query = query.eq('visible_to_agency', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(d => ({
    ...d,
    uploaded_at: d.created_at,   // ← fix Invalid Date
    notes:       d.upload_notes,
    file_path:   d.file_url,
    booking_id:  d.cruise_booking_id,
  }));
}

export async function uploadCruiseDocument(
  cruiseBookingId: string,
  file: File,
  documentType: DocumentType,
  userId: string,
  notes?: string
): Promise<CruiseDocument> {
  const supabase = await createClient();
  const fileExt  = file.name.split('.').pop();
  const fileName = `cruise/${cruiseBookingId}/${Date.now()}_${documentType}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('booking-documents')
    .upload(fileName, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('booking-documents')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('booking_documents')
    .insert({
      cruise_booking_id: cruiseBookingId,
      pre_booking_id:    null,
      document_type:     documentType,
      file_name:         file.name,
      file_url:          urlData.publicUrl,
      file_size:         file.size,
      mime_type:         file.type,
      uploaded_by:       userId,
      upload_notes:      notes || null,
      visible_to_agency: true,
      created_at:        new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  return {
    ...data,
    uploaded_at: data.created_at,
    notes:       data.upload_notes,
    file_path:   data.file_url,
    booking_id:  data.cruise_booking_id,
  };
}

export async function deleteCruiseDocument(documentId: string): Promise<void> {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from('booking_documents')
    .select('file_url')
    .eq('id', documentId)
    .single();

  if (doc?.file_url) {
    const urlParts    = doc.file_url.split('/');
    const bucketIndex = urlParts.indexOf('booking-documents');
    if (bucketIndex !== -1) {
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      await supabase.storage.from('booking-documents').remove([filePath]);
    }
  }

  const { error } = await supabase
    .from('booking_documents')
    .delete()
    .eq('id', documentId);
  if (error) throw error;
}