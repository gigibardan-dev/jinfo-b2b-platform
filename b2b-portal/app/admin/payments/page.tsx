import { createClient } from '@/lib/supabase/server';
import PaymentsDashboardClient from './PaymentsDashboardClient';

export default async function PaymentsDashboardPage() {
  const supabase = await createClient();

  // Fetch all payment records with related booking info
  const { data: paymentsData } = await supabase
    .from('payment_records')
    .select(`
      id,
      amount,
      payment_method,
      paid_at,
      confirmation_notes,
      created_at,
      pre_booking:pre_bookings!pre_booking_id (
        id,
        booking_number,
        total_price,
        status,
        agency:agencies!agency_id (
          id,
          company_name
        ),
        circuit:circuits!circuit_id (
          id,
          name
        )
      )
    `)
    .order('paid_at', { ascending: false });

  // Fetch all approved bookings with payment calculations
  const { data: bookingsData } = await supabase
    .from('pre_bookings')
    .select(`
      id,
      booking_number,
      total_price,
      status,
      num_adults,
      num_children,
      agency:agencies!agency_id (
        id,
        company_name
      )
    `)
    .in('status', ['approved', 'pending']);

  // Map payments by booking
  const paymentsMap = new Map();
  (paymentsData || []).forEach((payment: any) => {
    const bookingId = payment.pre_booking?.id;
    if (bookingId) {
      if (!paymentsMap.has(bookingId)) {
        paymentsMap.set(bookingId, []);
      }
      paymentsMap.get(bookingId).push(payment);
    }
  });

  // Calculate payment status for each booking
  const bookingsWithStatus = (bookingsData || []).map((booking: any) => {
    const payments = paymentsMap.get(booking.id) || [];
    const totalAmount = parseFloat(booking.total_price || 0);
    const paidAmount = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

    let paymentStatus = 'pending';
    if (paidAmount === 0) paymentStatus = 'pending';
    else if (paidAmount >= totalAmount) paymentStatus = 'paid';
    else paymentStatus = 'partial';

    return {
      id: booking.id,
      booking_reference: booking.booking_number,
      agency: booking.agency,
      status: booking.status,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_status: paymentStatus,
      payments_count: payments.length
    };
  });

  // Calculate stats
  const totalRevenue = (paymentsData || []).reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
  const pendingAmount = bookingsWithStatus
    .filter((b: any) => b.payment_status !== 'paid')
    .reduce((sum: number, b: any) => sum + (b.total_amount - b.paid_amount), 0);

  // Transform payments data for client
  const transformedPayments = (paymentsData || []).map((payment: any) => ({
    id: payment.id,
    amount: parseFloat(payment.amount || 0),
    payment_method: payment.payment_method || 'other',
    payment_date: payment.paid_at,
    reference_number: payment.confirmation_notes,
    booking: {
      id: payment.pre_booking?.id,
      booking_reference: payment.pre_booking?.booking_number,
      agency: {
        name: payment.pre_booking?.agency?.company_name
      }
    }
  }));

  return (
    <PaymentsDashboardClient
      payments={transformedPayments}
      bookings={bookingsWithStatus}
      stats={{
        totalRevenue,
        pendingAmount,
        totalPayments: paymentsData?.length || 0,
        paidBookings: bookingsWithStatus.filter((b: any) => b.payment_status === 'paid').length,
        totalBookings: bookingsWithStatus.length
      }}
    />
  );
}