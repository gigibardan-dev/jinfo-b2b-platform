// app/admin/bookings/cruise/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import CruiseBookingDetailsClient from './CruiseBookingDetailsClient';

async function getCruiseBooking(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cruise_bookings')
    .select(`
      *,
      agencies (
        id, company_name, contact_person,
        email, phone, commission_rate
      )
    `)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function AdminCruiseBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  if (role !== 'admin' && role !== 'superadmin' && role !== 'operator') redirect('/dashboard');

  const { id } = await params;
  const booking = await getCruiseBooking(id);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <CruiseBookingDetailsClient booking={booking} />
    </div>
  );
}