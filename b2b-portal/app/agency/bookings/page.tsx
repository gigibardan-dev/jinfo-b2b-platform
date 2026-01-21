import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

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

  // Get bookings with circuit and departure data
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
      )
    `)
    .eq('agency_id', agencyData.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return bookings || [];
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

  // Group bookings by status
  const pending = bookings.filter(b => b.status === 'pending');
  const approved = bookings.filter(b => b.status === 'approved');
  const rejected = bookings.filter(b => b.status === 'rejected');
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string; icon: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'În așteptare', icon: '⏳' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Aprobat', icon: '✅' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Respins', icon: '❌' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Anulat', icon: '🚫' },
    };
    
    const badge = badges[status] || badges.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </span>
    );
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-pulse">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-2xl">✅</span>
                <div>
                  <div className="font-bold text-green-800 mb-1">Pre-rezervare trimisă cu succes!</div>
                  <div className="text-sm text-green-700">
                    Vei primi un răspuns de la J'Info Tours în maximum 24 ore.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">📋</div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Pre-Rezervările Mele
                    </h1>
                    <p className="text-orange-100">
                      Gestionează și monitorizează pre-rezervările tale
                    </p>
                  </div>
                </div>
                
                <Link
                  href="/"
                  className="px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold"
                >
                  ➕ Rezervare nouă
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
              <div className="bg-white rounded-lg p-4 text-center border-2 border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{pending.length}</div>
                <div className="text-sm text-gray-600 mt-1">În așteptare</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{approved.length}</div>
                <div className="text-sm text-gray-600 mt-1">Aprobate</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border-2 border-red-200">
                <div className="text-3xl font-bold text-red-600">{rejected.length}</div>
                <div className="text-sm text-gray-600 mt-1">Respinse</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border-2 border-gray-200">
                <div className="text-3xl font-bold text-gray-600">{bookings.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nicio pre-rezervare încă
              </h3>
              <p className="text-gray-600 mb-6">
                Creează prima ta pre-rezervare pentru a începe
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Explorează circuitele →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: any) => {
                const circuit = booking.circuits;
                const departure = booking.departures;
                const depDate = departure ? new Date(departure.departure_date) : null;
                const totalPax = booking.num_adults + booking.num_children;
                
                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 border-gray-100 hover:border-orange-200"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {circuit?.name || 'Circuit necunoscut'}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {booking.booking_number && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold">Nr:</span>
                                <span className="font-mono">{booking.booking_number}</span>
                              </span>
                            )}
                            {depDate && (
                              <span className="flex items-center gap-1">
                                📅 {depDate.toLocaleDateString('ro-RO', { 
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              👥 {totalPax} {totalPax === 1 ? 'persoană' : 'persoane'}
                            </span>
                            <span className="flex items-center gap-1">
                              🏨 {booking.room_type}
                            </span>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-sm text-gray-600 mb-1">Total</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {booking.total_price} EUR
                          </div>
                          {booking.agency_commission && (
                            <div className="text-sm text-green-600 font-medium">
                              Comision: +{booking.agency_commission} EUR
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Passengers */}
                      {booking.passengers && Array.isArray(booking.passengers) && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            Pasageri:
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {booking.passengers.map((pax: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-700">
                                <span className="text-gray-500">{idx + 1}.</span>
                                <span className="font-medium">{pax.name}</span>
                                <span className="text-gray-500">({pax.age} ani)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {booking.agency_notes && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-900 mb-1">
                            Observații:
                          </div>
                          <div className="text-sm text-blue-800">
                            {booking.agency_notes}
                          </div>
                        </div>
                      )}

                      {/* Admin Response */}
                      {booking.status === 'rejected' && booking.rejection_reason && (
                        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-sm font-semibold text-red-900 mb-1">
                            Motiv respingere:
                          </div>
                          <div className="text-sm text-red-800">
                            {booking.rejection_reason}
                          </div>
                        </div>
                      )}

                      {booking.status === 'approved' && booking.approval_notes && (
                        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm font-semibold text-green-900 mb-1">
                            Notă aprobare:
                          </div>
                          <div className="text-sm text-green-800">
                            {booking.approval_notes}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Creat: {new Date(booking.created_at).toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        <Link
                          href={`/circuits/${circuit?.slug || ''}`}
                          className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                        >
                          Vezi circuitul →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}