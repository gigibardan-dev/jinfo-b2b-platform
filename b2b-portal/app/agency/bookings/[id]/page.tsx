import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import AgencyBookingDetailsClient from './AgencyBookingDetailsClient';

interface AgencyBookingDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgencyBookingDetailsPage({ params }: AgencyBookingDetailsPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!agency) {
    redirect('/dashboard');
  }

  const { data: booking, error } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuit:circuits!circuit_id (
        id,
        name,
        title,
        slug,
        nights,
        continent
      ),
      departure:departures!departure_id (
        id,
        departure_date,
        return_date,
        room_type,
        price,
        status,
        available_spots,
        min_participants
      ),
      agency:agencies!agency_id (
        id,
        company_name,
        email,
        phone,
        contact_person,
        commission_rate
      )
    `)
    .eq('id', id)
    .eq('agency_id', agency.id)
    .single();

  if (error) {
    console.error('Error loading booking:', error);
    notFound();
  }

  if (!booking) {
    notFound();
  }

  return <AgencyBookingDetailsClient booking={booking} />;
}
