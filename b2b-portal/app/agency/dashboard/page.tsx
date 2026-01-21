import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

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

  // Fetch agency data
  const supabase = await createClient();
  const { data: agencyData } = await supabase
    .from('agencies')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">🏢</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard Agenție
                </h1>
                <p className="text-gray-600">
                  Bine ai venit, {agencyData?.company_name || user.email}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className="text-xl font-bold text-green-600">
                    ✓ Activ
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Companie</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {agencyData?.company_name || '-'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Comision</div>
                  <div className="text-xl font-bold text-orange-500">
                    {agencyData?.commission_rate || '0'}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>⚡</span>
              <span>Acțiuni Rapide</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                href="/agency/profile"
                className="block p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl border-2 border-orange-200 transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">👤</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      Profilul Meu
                    </h4>
                    <p className="text-sm text-gray-600">
                      Vezi și editează datele agenției
                    </p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/agency/bookings"
                className="block p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      Pre-Rezervările Mele
                    </h4>
                    <p className="text-sm text-gray-600">
                      Vezi și gestionează pre-rezervările
                    </p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/"
                className="block p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border-2 border-green-200 transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🗺️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                      Circuite Disponibile
                    </h4>
                    <p className="text-sm text-gray-600">
                      Explorează și rezervă circuite
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>📊</span>
              <span>Statisticile Mele</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                <div className="text-sm text-gray-600">Pre-Rezervări Active</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <div className="text-3xl mb-2">✓</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                <div className="text-sm text-gray-600">Rezervări Confirmate</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                <div className="text-sm text-gray-600">Total Clienți</div>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-gray-500">
              Statisticile vor fi populate când vei avea rezervări
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>🕐</span>
              <span>Activitate Recentă</span>
            </h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600">
                Nu există activitate recentă
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Creează prima ta pre-rezervare pentru a începe
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}