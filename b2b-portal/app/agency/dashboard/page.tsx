import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

async function getAgencyStats(userId: string) {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!agency) {
    return { agencyData: null, stats: null };
  }

  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select('id, status, num_adults, num_children')
    .eq('agency_id', agency.id);

  const activeBookings = bookings?.filter(b => b.status === 'pending' || b.status === 'approved').length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === 'approved').length || 0;
  const totalClients = bookings?.reduce((sum, b) => sum + (b.num_adults || 0) + (b.num_children || 0), 0) || 0;

  return {
    agencyData: agency,
    stats: {
      activeBookings,
      confirmedBookings,
      totalClients
    }
  };
}

export default async function AgencyDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Only active agencies can access this page
  if (role !== 'agency') {
    redirect('/dashboard');
  }

  const { agencyData, stats } = await getAgencyStats(user.id);

  if (!agencyData || !stats) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
     
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                🏢
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                  Dashboard Agenție
                </h1>
                <p className="text-green-100 text-sm">
                  Bine ai venit, <span className="font-semibold">{agencyData?.company_name || user.email}</span>
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
                <div className="text-center">
                  <div className="text-xs text-green-100 mb-1">Status</div>
                  <div className="text-lg font-bold text-white">✓ Activ</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-xs text-green-100 mb-1">Comision</div>
                  <div className="text-lg font-bold text-white">{agencyData?.commission_rate || '0'}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - TOP POSITION */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📊</span>
            <h2 className="text-2xl font-bold text-gray-900">Statisticile Mele</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Bookings */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeBookings}</div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Active</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Pre-Rezervări Active</div>
              </div>
            </div>

            {/* Confirmed Bookings */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 border-b-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    ✓
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.confirmedBookings}</div>
                    <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Confirmate</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Rezervări Confirmate</div>
              </div>
            </div>

            {/* Total Clients */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 border-b-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    👥
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalClients}</div>
                    <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Persoane</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Total Călători</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-2xl font-bold text-gray-900">Acțiuni Rapide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              href="/agency/profile"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      Profilul Meu
                    </h3>
                    <p className="text-sm text-gray-600">
                      Editează datele agenției
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link 
              href="/agency/bookings"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      Rezervările Mele
                    </h3>
                    <p className="text-sm text-gray-600">
                      Gestionează pre-rezervările
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    🗺️
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      Circuite
                    </h3>
                    <p className="text-sm text-gray-600">
                      Explorează și rezervă
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/agency/payments"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    💰
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      Plăți
                    </h3>
                    <p className="text-sm text-gray-600">
                      Vezi statusul plăților
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Agency Info Card */}
        <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">ℹ️</span>
            <h2 className="text-2xl font-bold">Informații Agenție</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-sm text-white/70 mb-1">Email Contact</div>
              <div className="text-lg font-semibold">{user.email}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-sm text-white/70 mb-1">Companie</div>
              <div className="text-lg font-semibold">{agencyData?.company_name || 'Nu este setat'}</div>
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        {stats.activeBookings === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Începe Prima Ta Rezervare</h3>
              <p className="text-gray-600 mb-6">
                Explorează circuitele disponibile și creează prima ta pre-rezervare pentru a începe colaborarea cu J'Info Tours
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <span>🗺️</span>
                <span>Vezi Circuitele</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      
    </div>
  );
}