export type AgencyStatus = 'active' | 'pending' | 'suspended';

export interface Agency {
  id: string;
  user_id: string;
  company_name: string;
  trade_register: string;
  registration_number?: string;
  contact_person: string;
  phone: string;
  email: string;
  billing_address: string;
  billing_city: string;
  billing_county?: string;
  billing_postal_code?: string;
  billing_country?: string;
  bank_name?: string;
  bank_account?: string;
  commission_rate: number;
  status: AgencyStatus;
  approved_at?: string;
  approved_by?: string;
  suspended_at?: string;
  suspension_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields from joins
  total_bookings?: number;
  pending_bookings?: number;
  confirmed_bookings?: number;
  validated_bookings?: number;
  total_commission?: number;
}

export interface AgencyStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  validated_bookings: number;
  total_commission: number;
}

export interface UpdateAgencyData {
  commission_rate?: number;
  contact_person?: string;
  phone?: string;
  admin_notes?: string;
}

export interface AgencySummary {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}
