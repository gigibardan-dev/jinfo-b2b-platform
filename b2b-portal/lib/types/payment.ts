export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'other';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSummary {
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: PaymentStatus;
  payments: Payment[];
}

export interface CreatePaymentInput {
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  notes?: string;
}
