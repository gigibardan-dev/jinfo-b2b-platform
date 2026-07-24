// lib/services/cruise-payments.ts
import { createClient } from '@/lib/supabase/server';

export interface CruisePayment {
  id: string;
  cruise_booking_id: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  paid_at: string | null;
  confirmed_by: string | null;
  confirmation_notes: string | null;
  created_at: string;
}

export async function getCruiseBookingPayments(cruiseBookingId: string): Promise<CruisePayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cruise_payment_records')
    .select('*')
    .eq('cruise_booking_id', cruiseBookingId)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCruisePayment(
  input: {
    cruise_booking_id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    notes?: string;
  },
  userId: string
): Promise<CruisePayment> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cruise_payment_records')
    .insert({
      cruise_booking_id: input.cruise_booking_id,
      amount:            input.amount,
      payment_method:    input.payment_method,
      payment_type:      'manual',
      paid_at:           input.payment_date,
      confirmed_by:      userId,
      confirmation_notes: input.notes || null,
      created_at:        new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCruisePayment(paymentId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('cruise_payment_records')
    .delete()
    .eq('id', paymentId);
  if (error) throw error;
}