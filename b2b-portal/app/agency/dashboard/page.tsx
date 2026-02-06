import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
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

  if (role !== 'agency') {
    redirect('/dashboard');
  }

  const { agencyData, stats } = await getAgencyStats(user.id);

  if (!agencyData || !stats) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              🏢
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">
                Dashboard Agenție
              </h1>
              <p className="text-orange-100 text-sm">
                Bine ai venit, <span className="font-semibold">{agencyData?.company_name || user.email}</span>
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
              <div className="text-center">
                <div className="text-xs text-orange-100 mb-1">Status</div>
                <div className="text-lg font-bold text-white capitalize">
                  {agencyData?.status === 'active' ? '✓ Activ' : agencyData?.status === 'pending' ? '⏳ Pending' : '🚫 Suspendat'}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-xs text-orange-100 mb-1">Comision</div>
                <div className="text-lg font-bold text-white">{agencyData?.commission_rate || '0'}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📊</span>
          <h2 className="text-xl font-bold text-gray-900">Statisticile Mele</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Bookings */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-blue-200">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                  📝
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stats.activeBookings}</div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Active</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Pre-Rezervări Active</div>
              <div className="text-xs text-gray-500 mt-1">În procesare și confirmate</div>
            </div>
          </div>

          {/* Confirmed Bookings */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-green-200">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                  ✅
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stats.confirmedBookings}</div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Confirmate</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Rezervări Confirmate</div>
              <div className="text-xs text-gray-500 mt-1">Aprobate de J'Info Tours</div>
            </div>
          </div>

          {/* Total Clients */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-purple-200">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                  👥
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Călători</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Total Călători</div>
              <div className="text-xs text-gray-500 mt-1">Adulți și copii</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⚡</span>
          <h2 className="text-xl font-bold text-gray-900">Acțiuni Rapide</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/agency/bookings"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-blue-300"
          >
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                  📋
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Rezervările Mele
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Gestionează pre-rezervările tale
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-green-300"
          >
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                  🗺️
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  Explorează Circuite
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Vezi toate circuitele disponibile
              </p>
            </div>
          </Link>

          <Link
            href="/agency/payments"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-orange-300"
          >
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                  💰
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Status Plăți
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Monitorizează plățile tale
              </p>
            </div>
          </Link>

          <Link 
            href="/agency/profile"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300"
          >
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                  👤
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Profilul Meu
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Editează datele agenției
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Agency Info Card */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b-2 border-indigo-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">ℹ️</span>
            <h2 className="text-xl font-bold text-gray-900">Informații Agenție</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Companie</div>
              <div className="text-lg font-semibold text-gray-900">{agencyData?.company_name || 'Nu este setat'}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Email Contact</div>
              <div className="text-base font-semibold text-gray-900 truncate">{user.email}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Persoană Contact</div>
              <div className="text-lg font-semibold text-gray-900">{agencyData?.contact_person || 'Nu este setat'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      {stats.activeBookings === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md border-2 border-green-200 p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Începe Prima Ta Rezervare</h3>
            <p className="text-gray-600 mb-6">
              Explorează circuitele disponibile și creează prima ta pre-rezervare pentru a începe colaborarea cu J'Info Tours
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <span>🗺️</span>
              <span>Vezi Circuitele</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}