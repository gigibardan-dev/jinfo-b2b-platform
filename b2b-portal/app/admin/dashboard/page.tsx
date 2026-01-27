import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

async function getAdminStats() {
  const supabase = await createClient();

  const { data: agencies } = await supabase
    .from('agencies')
    .select('id, status')
    .eq('status', 'active');

  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select('id, status, total_price');

  const { data: payments } = await supabase
    .from('payment_records')
    .select('amount');

  const activeAgencies = agencies?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
  const totalBookings = bookings?.length || 0;
  const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0) || 0;

  return {
    activeAgencies,
    pendingBookings,
    totalBookings,
    totalRevenue
  };
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Only admins can access this page
  if (role !== 'admin' && role !== 'superadmin' && role !== 'operator') {
    redirect('/dashboard');
  }

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      
      <main className="max-w-7xl mx-auto px-4 py-2 space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                👨‍💼
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                  Dashboard Administrator
                </h1>
                <p className="text-orange-100 text-sm">
                  Bine ai venit, <span className="font-semibold">{user.email}</span>
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
                <div className="text-center">
                  <div className="text-xs text-orange-100 mb-1">Status</div>
                  <div className="text-lg font-bold text-white">✓ Activ</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-xs text-orange-100 mb-1">Rol</div>
                  <div className="text-lg font-bold text-white capitalize">{role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - TOP POSITION */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📈</span>
            <h2 className="text-2xl font-bold text-gray-900">Statistici Rapide</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Agencies */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border-b-4 border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    🏢
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeAgencies}</div>
                    <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Total</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Agenții Active</div>
              </div>
            </div>

            {/* Pending Bookings */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    ⏳
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingBookings}</div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Pending</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">În Așteptare</div>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 border-b-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalBookings}</div>
                    <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Toate</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Total Rezervări</div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 border-b-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform">
                    💰
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalRevenue.toFixed(0)} €</div>
                    <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">EUR</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Venit Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-2xl font-bold text-gray-900">Acțiuni Administrator</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/admin/create-agency"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    ➕
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      Creare Agenție
                    </h3>
                    <p className="text-sm text-gray-600">
                      Creează un cont nou de agenție în sistem
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/bookings"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      Gestionare Rezervări
                    </h3>
                    <p className="text-sm text-gray-600">
                      Aprobă sau respinge pre-rezervările din sistem
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/agencies"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    🏢
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      Gestionare Agenții
                    </h3>
                    <p className="text-sm text-gray-600">
                      Vezi și administrează toate agențiile
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/payments"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-300"
            >
              <div className="h-full p-6 bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    💰
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      Gestionare Plăți
                    </h3>
                    <p className="text-sm text-gray-600">
                      Înregistrează și monitorizează toate plățile
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">💡</span>
            <h2 className="text-2xl font-bold">Informații Rapide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-3xl mb-3">📊</div>
              <div className="text-lg font-semibold mb-1">Performanță</div>
              <p className="text-sm text-white/80">
                Sistem operațional cu {stats.activeAgencies} agenții active
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-3xl mb-3">⚡</div>
              <div className="text-lg font-semibold mb-1">Activitate</div>
              <p className="text-sm text-white/80">
                {stats.pendingBookings} rezervări necesită atenție
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-3xl mb-3">🎯</div>
              <div className="text-lg font-semibold mb-1">Obiectiv</div>
              <p className="text-sm text-white/80">
                Continuă creșterea și optimizarea platformei
              </p>
            </div>
          </div>
        </div>
      </main>

     
    </div>
  );
}