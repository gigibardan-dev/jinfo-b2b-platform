import { createClient } from '@/lib/supabase/server';
import type { Payment, PaymentSummary, CreatePaymentInput, PaymentStatus } from '@/lib/types/payment';

export async function getBookingPayments(bookingId: string): Promise<Payment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPaymentSummary(bookingId: string, totalAmount: number): Promise<PaymentSummary> {
  const payments = await getBookingPayments(bookingId);

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
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
    .from('payments')
    .insert({
      ...input,
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePayment(paymentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('payments')
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
    .from('payments')
    .select(`
      *,
      booking:bookings(
        id,
        booking_reference,
        agency:agencies(name),
        circuit:circuits(title)
      )
    `)
    .order('payment_date', { ascending: false });

  if (filters?.dateFrom) {
    query = query.gte('payment_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('payment_date', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
