// app/agency/payments/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import AgencyPaymentsDashboardClient from './AgencyPaymentsDashboardClient';

async function getAgencyPaymentsData(userId: string) {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('id, company_name')
    .eq('user_id', userId)
    .single();

  if (!agency) return null;

  // ── Circuite ──────────────────────────────────────────────────────────────
  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuit:circuits!circuit_id ( id, name, slug, nights ),
      departure:departures!departure_id ( id, departure_date, return_date )
    `)
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  const bookingsWithPayments = await Promise.all(
    (bookings || []).map(async (booking) => {
      const { data: payments } = await supabase
        .from('payment_records')
        .select('*')
        .eq('pre_booking_id', booking.id)
        .order('paid_at', { ascending: false });

      const totalPaid  = (payments || []).reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      const remaining  = booking.total_price - totalPaid;

      return {
        ...booking,
        payments:         payments || [],
        total_paid:       totalPaid,
        remaining_amount: remaining,
        isCruise:         false,
      };
    })
  );

  // ── Croaziere ─────────────────────────────────────────────────────────────
  const { data: cruises } = await supabase
    .from('cruise_bookings')
    .select('*')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  const cruisesWithPayments = await Promise.all(
    (cruises || []).map(async (cruise) => {
      const { data: payments } = await supabase
        .from('cruise_payment_records')
        .select('*')
        .eq('cruise_booking_id', cruise.id)
        .order('paid_at', { ascending: false });

      const totalPaid  = (payments || []).reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      const grossAmt   = Number(cruise.gross_amount || 0);
      const remaining  = grossAmt - totalPaid;

      return {
        ...cruise,
        payments:         (payments || []).map(p => ({
          ...p,
          // normalizare câmpuri pentru UI
          paid_at: p.paid_at,
        })),
        total_paid:       totalPaid,
        remaining_amount: remaining,
        total_price:      grossAmt,
        // câmpuri compatibile cu AgencyPaymentsDashboardClient
        circuit:   { name: `🚢 ${cruise.ship_name || 'Croazieră'}` },
        departure: { departure_date: cruise.sailing_date },
        isCruise:  true,
      };
    })
  );

  // ── Plăți circuite aplatizate ─────────────────────────────────────────────
  const circuitPayments = bookingsWithPayments.flatMap(b =>
    b.payments.map((p: any) => ({
      ...p,
      booking_number: b.booking_number,
      circuit_name:   b.circuit?.name || 'N/A',
      total_price:    b.total_price,
      pre_booking_id: b.id,
      isCruise:       false,
    }))
  );

  // ── Plăți croaziere aplatizate ────────────────────────────────────────────
  const cruisePayments = cruisesWithPayments.flatMap(c =>
    c.payments.map((p: any) => ({
      ...p,
      booking_number: c.booking_number,
      circuit_name:   `🚢 ${c.ship_name || 'Croazieră'}`,
      total_price:    c.gross_amount,
      pre_booking_id: c.id,
      isCruise:       true,
    }))
  );

  // ── Combinate și sortate ──────────────────────────────────────────────────
  const allBookings = [...bookingsWithPayments, ...cruisesWithPayments];
  const allPayments = [...circuitPayments, ...cruisePayments]
    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

  const stats = {
    totalPaid:         allBookings.reduce((s, b) => s + b.total_paid, 0),
    totalOutstanding:  allBookings.reduce((s, b) => s + Math.max(b.remaining_amount, 0), 0),
    bookingsFullyPaid: allBookings.filter(b => b.remaining_amount <= 0).length,
    bookingsPending:   allBookings.filter(b => b.remaining_amount > 0).length,
  };

  return { bookings: allBookings, payments: allPayments, stats };
}

export default async function AgencyPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  if (role !== 'agency') redirect('/dashboard');

  const data = await getAgencyPaymentsData(user.id);
  if (!data) redirect('/dashboard');

  return (
    <AgencyPaymentsDashboardClient
      bookings={data.bookings}
      payments={data.payments}
      stats={data.stats}
    />
  );
}