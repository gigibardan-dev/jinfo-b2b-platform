export type DocumentType =
  | 'contract'
  | 'invoice'
  | 'payment_receipt'
  | 'voucher'
  | 'passenger_list'
  | 'other';

export interface BookingDocument {
  id: string;
  booking_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

export interface UploadDocumentInput {
  booking_id: string;
  document_type: DocumentType;
  file: File;
  notes?: string;
}
