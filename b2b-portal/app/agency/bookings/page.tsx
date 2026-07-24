// app/agency/bookings/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import AgencyBookingsClient from '@/components/agency/AgencyBookingsClient';
import AgencyCruiseBookingCard from '@/components/agency/AgencyCruiseBookingCard';
import Link from 'next/link';

async function getAgencyData(userId: string) {
  const supabase = await createClient();

  const { data: agencyData } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!agencyData) return { circuits: [], cruises: [] };

  // Circuite
  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuit:circuits!circuit_id ( id, name, slug, nights, main_image, continent ),
      departure:departures!departure_id ( id, departure_date, return_date )
    `)
    .eq('agency_id', agencyData.id)
    .order('created_at', { ascending: false });

  // Croaziere
  const { data: cruises } = await supabase
    .from('cruise_bookings')
    .select('*')
    .eq('agency_id', agencyData.id)
    .order('created_at', { ascending: false });

  // Plăți circuite
  const bookingsWithPayments = await Promise.all(
    (bookings || []).map(async (booking) => {
      const supabase2 = await createClient();
      const { data: payments } = await supabase2
        .from('payment_records')
        .select('amount')
        .eq('pre_booking_id', booking.id);
      return { ...booking, payments: payments || [] };
    })
  );

  // Plăți croaziere
  const cruisesWithPayments = await Promise.all(
    (cruises || []).map(async (cruise) => {
      const supabase2 = await createClient();
      const { data: payments } = await supabase2
        .from('cruise_payment_records')
        .select('amount')
        .eq('cruise_booking_id', cruise.id);
      const paidAmount = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
      return { ...cruise, paidAmount };
    })
  );

  return { circuits: bookingsWithPayments, cruises: cruisesWithPayments };
}

export default async function AgencyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  if (role !== 'agency') redirect('/dashboard');

  const { success, tab } = await searchParams;
  const activeTab = tab === 'cruises' ? 'cruises' : 'circuits';

  const { circuits, cruises } = await getAgencyData(user.id);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-2 flex gap-2">
        <Link
          href="/agency/bookings?tab=circuits"
          className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'circuits'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">🗺️</span>
          <span>Circuite</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'circuits' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {circuits.length}
          </span>
        </Link>
        <Link
          href="/agency/bookings?tab=cruises"
          className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'cruises'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">🚢</span>
          <span>Croaziere</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'cruises' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {cruises.length}
          </span>
        </Link>
      </div>

      {/* Conținut */}
      {activeTab === 'circuits' ? (
        <AgencyBookingsClient bookings={circuits} successMessage={success} />
      ) : (
        <div className="space-y-4">
          {cruises.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">🚢</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nicio Rezervare Croazieră</h3>
              <p className="text-gray-600">Rezervările de croaziere făcute prin JinfoCruise vor apărea aici.</p>
            </div>
          ) : (
            cruises.map((cruise: any) => (
              <AgencyCruiseBookingCard
                key={cruise.id}
                booking={cruise}
                paidAmount={cruise.paidAmount || 0}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}