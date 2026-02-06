import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import AgencyBookingsClient from '@/components/agency/AgencyBookingsClient';

async function getAgencyBookings(userId: string) {
  const supabase = await createClient();

  // Get agency data
  const { data: agencyData } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!agencyData) {
    return [];
  }

  // Get bookings with circuit, departure, and payments data
  const { data: bookings, error } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuit:circuits!circuit_id (
        id,
        name,
        slug,
        nights,
        main_image,
        continent
      ),
      departure:departures!departure_id (
        id,
        departure_date,
        return_date
      )
    `)
    .eq('agency_id', agencyData.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  // Get payments for all bookings
  const bookingsWithPayments = await Promise.all(
    (bookings || []).map(async (booking) => {
      const { data: payments } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('pre_booking_id', booking.id);

      return {
        ...booking,
        payments: payments || []
      };
    })
  );

  return bookingsWithPayments;
}

export default async function AgencyBookingsPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);
  
  if (role !== 'agency') {
    redirect('/dashboard');
  }

  const bookings = await getAgencyBookings(user.id);
  const { success } = await searchParams;

  return <AgencyBookingsClient bookings={bookings} successMessage={success} />;
}