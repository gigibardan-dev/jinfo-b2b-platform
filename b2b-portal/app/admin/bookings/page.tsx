import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import AdminBookingCard from '@/components/admin/AdminBookingCard';
import Link from 'next/link';

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

const ITEMS_PER_PAGE = 10;

export default async function AdminBookingsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string; search?: string; page?: string }>;
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
  const { filter, search, page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  // Filter by status
  let filteredBookings = filter && filter !== 'all' 
    ? bookings.filter((b: any) => b.status === filter)
    : bookings;

  // Search filter
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    filteredBookings = filteredBookings.filter((b: any) => {
      const circuitName = b.circuits?.name?.toLowerCase() || '';
      const agencyName = b.agencies?.company_name?.toLowerCase() || '';
      const bookingNumber = b.booking_number?.toLowerCase() || '';
      const contactPerson = b.agencies?.contact_person?.toLowerCase() || '';
      
      return (
        circuitName.includes(searchLower) ||
        agencyName.includes(searchLower) ||
        bookingNumber.includes(searchLower) ||
        contactPerson.includes(searchLower)
      );
    });
  }

  // Pagination
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b: any) => b.status === 'pending').length,
    approved: bookings.filter((b: any) => b.status === 'approved').length,
    rejected: bookings.filter((b: any) => b.status === 'rejected').length,
    cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
  };

  // Build query params helper
  const buildQueryParams = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    return searchParams.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              📊
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">
                Gestionare Pre-Rezervări
              </h1>
              <p className="text-blue-100 text-sm">
                Vizualizează și gestionează toate rezervările din platformă
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📈</span>
          <h2 className="text-xl font-bold text-gray-900">Filtrare Rapidă</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            href={`/admin/bookings?${buildQueryParams({ filter: 'all', search })}`}
            className={`group bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-2 ${
              !filter || filter === 'all' 
                ? 'border-gray-400 ring-2 ring-gray-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">📋</div>
                <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Total Rezervări</div>
            </div>
          </Link>
          
          <Link
            href={`/admin/bookings?${buildQueryParams({ filter: 'pending', search })}`}
            className={`group bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-2 ${
              filter === 'pending' 
                ? 'border-yellow-400 ring-2 ring-yellow-200' 
                : 'border-yellow-200 hover:border-yellow-300'
            }`}
          >
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">⏳</div>
                <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
              </div>
              <div className="text-sm font-semibold text-gray-700">În Așteptare</div>
            </div>
          </Link>
          
          <Link
            href={`/admin/bookings?${buildQueryParams({ filter: 'approved', search })}`}
            className={`group bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-2 ${
              filter === 'approved' 
                ? 'border-green-400 ring-2 ring-green-200' 
                : 'border-green-200 hover:border-green-300'
            }`}
          >
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">✅</div>
                <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Aprobate</div>
            </div>
          </Link>
          
          <Link
            href={`/admin/bookings?${buildQueryParams({ filter: 'rejected', search })}`}
            className={`group bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-2 ${
              filter === 'rejected' 
                ? 'border-red-400 ring-2 ring-red-200' 
                : 'border-red-200 hover:border-red-300'
            }`}
          >
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">❌</div>
                <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Respinse</div>
            </div>
          </Link>
          
          <Link
            href={`/admin/bookings?${buildQueryParams({ filter: 'cancelled', search })}`}
            className={`group bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-2 ${
              filter === 'cancelled' 
                ? 'border-gray-400 ring-2 ring-gray-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">🚫</div>
                <div className="text-3xl font-bold text-gray-700">{stats.cancelled}</div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Anulate</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <form action="/admin/bookings" method="GET" className="flex gap-3">
          <input type="hidden" name="filter" value={filter || 'all'} />
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Caută după circuit, agenție, număr rezervare..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            Caută
          </button>
          {search && (
            <Link
              href={`/admin/bookings?${buildQueryParams({ filter })}`}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
            >
              Resetează
            </Link>
          )}
        </form>
      </div>

      {/* Bookings List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h2 className="text-xl font-bold text-gray-900">
              {filter && filter !== 'all' 
                ? `Rezervări ${filter === 'pending' ? 'în Așteptare' : filter === 'approved' ? 'Aprobate' : filter === 'rejected' ? 'Respinse' : 'Anulate'}`
                : 'Toate Rezervările'}
            </h2>
            <span className="text-sm text-gray-500">
              ({totalItems} {totalItems === 1 ? 'rezultat' : 'rezultate'})
            </span>
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-gray-600">
              Pagina {currentPage} din {totalPages}
            </div>
          )}
        </div>

        {paginatedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Nicio Pre-Rezervare
            </h3>
            <p className="text-gray-600">
              {search 
                ? `Nu s-au găsit rezultate pentru "${search}"`
                : filter && filter !== 'all' 
                ? `Nu există pre-rezervări cu statusul "${filter}"`
                : 'Nu există pre-rezervări în sistem'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedBookings.map((booking: any) => (
                <AdminBookingCard key={booking.id} booking={booking} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/admin/bookings?${buildQueryParams({ filter, search, page: (currentPage - 1).toString() })}`}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-semibold"
                  >
                    ← Anterior
                  </Link>
                )}
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <Link
                          key={pageNum}
                          href={`/admin/bookings?${buildQueryParams({ filter, search, page: pageNum.toString() })}`}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold transition-all ${
                            pageNum === currentPage
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={pageNum} className="w-10 h-10 flex items-center justify-center text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {currentPage < totalPages && (
                  <Link
                    href={`/admin/bookings?${buildQueryParams({ filter, search, page: (currentPage + 1).toString() })}`}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-semibold"
                  >
                    Următor →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}