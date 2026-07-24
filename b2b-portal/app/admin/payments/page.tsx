// app/admin/payments/page.tsx
import { createClient } from '@/lib/supabase/server';
import PaymentsDashboardClient from './PaymentsDashboardClient';

export default async function PaymentsDashboardPage() {
  const supabase = await createClient();

  // ── Plăți circuite ────────────────────────────────────────────────────────
  const { data: paymentsData } = await supabase
    .from('payment_records')
    .select(`
      id, amount, payment_method, paid_at, confirmation_notes, created_at,
      pre_booking:pre_bookings!pre_booking_id (
        id, booking_number, total_price, status,
        agency:agencies!agency_id ( id, company_name ),
        circuit:circuits!circuit_id ( id, name )
      )
    `)
    .order('paid_at', { ascending: false });

  // ── Plăți croaziere ───────────────────────────────────────────────────────
  const { data: cruisePaymentsData } = await supabase
    .from('cruise_payment_records')
    .select(`
      id, amount, payment_method, paid_at, confirmation_notes, created_at,
      cruise_booking:cruise_bookings!cruise_booking_id (
        id, booking_number, gross_amount, status,
        agencies!agency_id ( id, company_name )
      )
    `)
    .order('paid_at', { ascending: false });

  // ── Rezervări circuite active ─────────────────────────────────────────────
  const { data: bookingsData } = await supabase
    .from('pre_bookings')
    .select(`
      id, booking_number, total_price, status, num_adults, num_children,
      agency:agencies!agency_id ( id, company_name )
    `)
    .in('status', ['approved', 'pending']);

  // ── Rezervări croaziere active ────────────────────────────────────────────
  const { data: cruiseBookingsData } = await supabase
    .from('cruise_bookings')
    .select(`
      id, booking_number, gross_amount, status, num_adults, num_children,
      agencies!agency_id ( id, company_name )
    `)
    .in('status', ['approved', 'pending']);

  // ── Map plăți per booking circuit ─────────────────────────────────────────
  const paymentsMap = new Map<string, any[]>();
  (paymentsData || []).forEach((payment: any) => {
    const bookingId = payment.pre_booking?.id;
    if (bookingId) {
      if (!paymentsMap.has(bookingId)) paymentsMap.set(bookingId, []);
      paymentsMap.get(bookingId)!.push(payment);
    }
  });

  // ── Map plăți per booking croazieră ───────────────────────────────────────
  const cruisePaymentsMap = new Map<string, any[]>();
  (cruisePaymentsData || []).forEach((payment: any) => {
    const bookingId = payment.cruise_booking?.id;
    if (bookingId) {
      if (!cruisePaymentsMap.has(bookingId)) cruisePaymentsMap.set(bookingId, []);
      cruisePaymentsMap.get(bookingId)!.push(payment);
    }
  });

  // ── Status plăți circuite ─────────────────────────────────────────────────
  const bookingsWithStatus = (bookingsData || []).map((booking: any) => {
    const payments    = paymentsMap.get(booking.id) || [];
    const totalAmount = parseFloat(booking.total_price || 0);
    const paidAmount  = payments.reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
    const paymentStatus =
      paidAmount === 0 ? 'pending' : paidAmount >= totalAmount ? 'paid' : 'partial';

    return {
      id:               booking.id,
      booking_reference: booking.booking_number,
      agency:           booking.agency,
      status:           booking.status,
      total_amount:     totalAmount,
      paid_amount:      paidAmount,
      payment_status:   paymentStatus,
      payments_count:   payments.length,
      isCruise:         false,
    };
  });

  // ── Status plăți croaziere ────────────────────────────────────────────────
  const cruiseBookingsWithStatus = (cruiseBookingsData || []).map((booking: any) => {
    const payments    = cruisePaymentsMap.get(booking.id) || [];
    const totalAmount = parseFloat(booking.gross_amount || 0);
    const paidAmount  = payments.reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
    const paymentStatus =
      paidAmount === 0 ? 'pending' : paidAmount >= totalAmount ? 'paid' : 'partial';

    return {
      id:               booking.id,
      booking_reference: `🚢 ${booking.booking_number}`,
      agency:           { name: booking.agencies?.company_name },
      status:           booking.status,
      total_amount:     totalAmount,
      paid_amount:      paidAmount,
      payment_status:   paymentStatus,
      payments_count:   payments.length,
      isCruise:         true,
    };
  });

  // ── Transform plăți circuite ──────────────────────────────────────────────
  const transformedCircuitPayments = (paymentsData || []).map((payment: any) => ({
    id:               payment.id,
    amount:           parseFloat(payment.amount || 0),
    payment_method:   payment.payment_method || 'other',
    payment_date:     payment.paid_at,
    reference_number: payment.confirmation_notes,
    isCruise:         false,
    booking: {
      id:                payment.pre_booking?.id,
      booking_reference: payment.pre_booking?.booking_number,
      agency:            { name: payment.pre_booking?.agency?.company_name },
    },
  }));

  // ── Transform plăți croaziere ─────────────────────────────────────────────
  const transformedCruisePayments = (cruisePaymentsData || []).map((payment: any) => ({
    id:               payment.id,
    amount:           parseFloat(payment.amount || 0),
    payment_method:   payment.payment_method || 'other',
    payment_date:     payment.paid_at,
    reference_number: payment.confirmation_notes,
    isCruise:         true,
    booking: {
      id:                payment.cruise_booking?.id,
      booking_reference: `🚢 ${payment.cruise_booking?.booking_number}`,
      agency:            { name: payment.cruise_booking?.agencies?.company_name },
    },
  }));

  // ── Combinate ─────────────────────────────────────────────────────────────
  const allPayments = [...transformedCircuitPayments, ...transformedCruisePayments]
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const allBookings = [...bookingsWithStatus, ...cruiseBookingsWithStatus];

  const totalRevenue   = allPayments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount  = allBookings
    .filter(b => b.payment_status !== 'paid')
    .reduce((s, b) => s + (b.total_amount - b.paid_amount), 0);

  return (
    <PaymentsDashboardClient
      payments={allPayments}
      bookings={allBookings}
      stats={{
        totalRevenue,
        pendingAmount,
        totalPayments: allPayments.length,
        paidBookings:  allBookings.filter(b => b.payment_status === 'paid').length,
        totalBookings: allBookings.length,
      }}
    />
  );
}