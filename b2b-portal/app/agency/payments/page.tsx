import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AgencyPaymentsDashboardClient from './AgencyPaymentsDashboardClient';

async function getAgencyPaymentsData(userId: string) {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('id, company_name')
    .eq('user_id', userId)
    .single();

  if (!agency) {
    return null;
  }

  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuit:circuits!circuit_id (
        id,
        name,
        slug,
        nights
      ),
      departure:departures!departure_id (
        id,
        departure_date,
        return_date
      )
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

      const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
      const remaining = booking.total_price - totalPaid;

      return {
        ...booking,
        payments: payments || [],
        total_paid: totalPaid,
        remaining_amount: remaining
      };
    })
  );

  const allPayments = bookingsWithPayments.flatMap(b =>
    b.payments.map((p: any) => ({
      ...p,
      booking_number: b.booking_number,
      circuit_name: b.circuit?.name || 'N/A',
      total_price: b.total_price
    }))
  );

  const stats = {
    totalPaid: bookingsWithPayments.reduce((sum, b) => sum + b.total_paid, 0),
    totalOutstanding: bookingsWithPayments.reduce((sum, b) => sum + Math.max(b.remaining_amount, 0), 0),
    bookingsFullyPaid: bookingsWithPayments.filter(b => b.remaining_amount <= 0).length,
    bookingsPending: bookingsWithPayments.filter(b => b.remaining_amount > 0).length
  };

  return {
    bookings: bookingsWithPayments,
    payments: allPayments,
    stats
  };
}

export default async function AgencyPaymentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  if (role !== 'agency') {
    redirect('/dashboard');
  }

  const data = await getAgencyPaymentsData(user.id);

  if (!data) {
    redirect('/dashboard');
  }

  return (
    <>
      <Header />
      <AgencyPaymentsDashboardClient
        bookings={data.bookings}
        payments={data.payments}
        stats={data.stats}
      />
      <Footer />
    </>
  );
}
