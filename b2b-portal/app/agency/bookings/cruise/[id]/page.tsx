// app/agency/bookings/cruise/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import AgencyCruiseBookingDetailsClient from './AgencyCruiseBookingDetailsClient';

async function getCruiseBooking(id: string, userId: string) {
  const supabase = await createClient();

  // Găsim agency_id-ul userului
  const { data: agencyData } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!agencyData) return null;

  const { data, error } = await supabase
    .from('cruise_bookings')
    .select(`
      *,
      agencies (
        id, company_name, commission_rate
      )
    `)
    .eq('id', id)
    .eq('agency_id', agencyData.id)  // securitate — doar rezervările proprii
    .single();

  if (error || !data) return null;
  return data;
}

export default async function AgencyCruiseBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  if (role !== 'agency') redirect('/dashboard');

  const { id } = await params;
  const booking = await getCruiseBooking(id, user.id);
  if (!booking) notFound();

  return <AgencyCruiseBookingDetailsClient booking={booking} />;
}