import { createClient } from '@/lib/supabase/server';
import type { Payment, PaymentSummary, CreatePaymentInput, PaymentStatus } from '@/lib/types/payment';

export async function getBookingPayments(bookingId: string): Promise<Payment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('pre_booking_id', bookingId)
    .order('paid_at', { ascending: false });

  if (error) throw error;
  
  // Map to expected format
  return (data || []).map(p => ({
    ...p,
    payment_date: p.paid_at,
    reference_number: p.confirmation_notes,
    notes: p.confirmation_notes
  }));
}

export async function getPaymentSummary(bookingId: string, totalAmount: number): Promise<PaymentSummary> {
  const payments = await getBookingPayments(bookingId);

  const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const remainingAmount = totalAmount - paidAmount;

  let status: PaymentStatus = 'pending';
  if (paidAmount === 0) {
    status = 'pending';
  } else if (paidAmount >= totalAmount) {
    status = 'paid';
  } else {
    status = 'partial';
  }

  return {
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    status,
    payments
  };
}

export async function createPayment(input: CreatePaymentInput, userId: string): Promise<Payment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_records')
    .insert({
      pre_booking_id: input.booking_id,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_type: 'manual',
      paid_at: input.payment_date,
      confirmed_by: userId,
      confirmation_notes: input.notes || input.reference_number,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  // Map to expected format
  return {
    ...data,
    payment_date: data.paid_at,
    reference_number: data.confirmation_notes,
    notes: data.confirmation_notes
  };
}

export async function deletePayment(paymentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('payment_records')
    .delete()
    .eq('id', paymentId);

  if (error) throw error;
}

export async function getAllPayments(filters?: {
  agencyId?: string;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('payment_records')
    .select(`
      *,
      booking:pre_bookings!pre_booking_id(
        id,
        booking_number,
        agency:agencies!agency_id(company_name),
        circuit:circuits!circuit_id(name)
      )
    `)
    .order('paid_at', { ascending: false });

  if (filters?.dateFrom) {
    query = query.gte('paid_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('paid_at', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
