import { createClient } from '@/lib/supabase/server';
import PaymentsDashboardClient from './PaymentsDashboardClient';

export default async function PaymentsDashboardPage() {
  const supabase = await createClient();

  const { data: paymentsData } = await supabase
    .from('payments')
    .select(`
      *,
      booking:bookings(
        id,
        booking_reference,
        status,
        number_of_travelers,
        agency:agencies(
          id,
          name
        ),
        circuit:circuits(
          id,
          title
        ),
        departure:departures(
          id,
          start_date,
          price_per_person
        )
      )
    `)
    .order('payment_date', { ascending: false });

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      status,
      number_of_travelers,
      departure:departures(
        price_per_person
      )
    `)
    .eq('status', 'approved');

  const bookingsWithPayments = bookingsData || [];

  const paymentsMap = new Map();
  (paymentsData || []).forEach((payment: any) => {
    const bookingId = payment.booking_id;
    if (!paymentsMap.has(bookingId)) {
      paymentsMap.set(bookingId, []);
    }
    paymentsMap.get(bookingId).push(payment);
  });

  const bookingsWithStatus = bookingsWithPayments.map((booking: any) => {
    const payments = paymentsMap.get(booking.id) || [];
    const totalAmount = booking.departure.price_per_person * booking.number_of_travelers;
    const paidAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    let paymentStatus = 'pending';
    if (paidAmount === 0) paymentStatus = 'pending';
    else if (paidAmount >= totalAmount) paymentStatus = 'paid';
    else paymentStatus = 'partial';

    return {
      ...booking,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_status: paymentStatus,
      payments_count: payments.length
    };
  });

  const totalRevenue = (paymentsData || []).reduce((sum: number, p: any) => sum + p.amount, 0);
  const pendingAmount = bookingsWithStatus
    .filter((b: any) => b.payment_status !== 'paid')
    .reduce((sum: number, b: any) => sum + (b.total_amount - b.paid_amount), 0);

  return (
    <PaymentsDashboardClient
      payments={paymentsData || []}
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
