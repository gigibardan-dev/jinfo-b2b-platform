import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BookingDetailsClient from './BookingDetailsClient';

interface BookingDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const supabase = await createClient();

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
        contact_person
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error loading booking:', error);
    notFound();
  }

  if (!booking) {
    notFound();
  }

  return <BookingDetailsClient booking={booking} />;
}
