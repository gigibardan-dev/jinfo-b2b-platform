import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BookingDetailsClient from './BookingDetailsClient';

interface BookingDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuit:circuits(
        id,
        title,
        duration,
        slug
      ),
      departure:departures(
        id,
        start_date,
        end_date,
        available_spots,
        price_per_person
      ),
      agency:agencies(
        id,
        company_name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single();

  if (!booking) {
    notFound();
  }

  return <BookingDetailsClient booking={booking} />;
}
