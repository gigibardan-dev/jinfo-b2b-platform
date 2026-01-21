import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdminBookingCard from '@/components/admin/AdminBookingCard';

async function getAllBookings() {
  const supabase = await createClient();
  
  const { data: bookings, error } = await supabase
    .from('pre_bookings')
    .select(`
      *,
      circuits (
        id,
        name,
        slug,
        main_image,
        continent
      ),
      departures (
        id,
        departure_date,
        return_date
      ),
      agencies (
        id,
        company_name,
        contact_person,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return bookings || [];
}

export default async function AdminBookingsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);
  
  if (role !== 'admin' && role !== 'superadmin' && role !== 'operator') {
    redirect('/dashboard');
  }

  const bookings = await getAllBookings();
  const { filter } = await searchParams;

  // Filter bookings
  const filteredBookings = filter && filter !== 'all' 
    ? bookings.filter((b: any) => b.status === filter)
    : bookings;

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b: any) => b.status === 'pending').length,
    approved: bookings.filter((b: any) => b.status === 'approved').length,
    rejected: bookings.filter((b: any) => b.status === 'rejected').length,
    cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">📊</div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Gestionare Pre-Rezervări
                  </h1>
                  <p className="text-blue-100">
                    Vizualizează și gestionează toate pre-rezervările din platformă
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50">
              <a
                href="/admin/bookings?filter=all"
                className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                  !filter || filter === 'all' ? 'border-gray-400 shadow-md' : 'border-gray-200'
                }`}
              >
                <div className="text-3xl font-bold text-gray-600">{stats.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </a>
              
              <a
                href="/admin/bookings?filter=pending"
                className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                  filter === 'pending' ? 'border-yellow-400 shadow-md' : 'border-yellow-200'
                }`}
              >
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600 mt-1">În așteptare</div>
              </a>
              
              <a
                href="/admin/bookings?filter=approved"
                className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                  filter === 'approved' ? 'border-green-400 shadow-md' : 'border-green-200'
                }`}
              >
                <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-600 mt-1">Aprobate</div>
              </a>
              
              <a
                href="/admin/bookings?filter=rejected"
                className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                  filter === 'rejected' ? 'border-red-400 shadow-md' : 'border-red-200'
                }`}
              >
                <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-gray-600 mt-1">Respinse</div>
              </a>
              
              <a
                href="/admin/bookings?filter=cancelled"
                className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                  filter === 'cancelled' ? 'border-gray-400 shadow-md' : 'border-gray-200'
                }`}
              >
                <div className="text-3xl font-bold text-gray-600">{stats.cancelled}</div>
                <div className="text-sm text-gray-600 mt-1">Anulate</div>
              </a>
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nicio pre-rezervare
              </h3>
              <p className="text-gray-600">
                {filter && filter !== 'all' 
                  ? `Nu există pre-rezervări cu statusul "${filter}"`
                  : 'Nu există pre-rezervări în sistem'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking: any) => (
                <AdminBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}