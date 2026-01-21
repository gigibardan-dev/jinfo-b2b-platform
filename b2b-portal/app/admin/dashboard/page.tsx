import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

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

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">👨‍💼</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard Administrator
                </h1>
                <p className="text-gray-600">
                  Bine ai venit, {user.email}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Rol</div>
                  <div className="text-xl font-bold text-orange-500 capitalize">
                    {role}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Email</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user.email}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className="text-xl font-bold text-green-600">
                    Activ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>⚙️</span>
              <span>Acțiuni Administrator</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                href="/admin/create-agency"
                className="block p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">➕</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      Creare Agenție
                    </h4>
                    <p className="text-sm text-gray-600">
                      Creează un cont nou de agenție
                    </p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/admin/bookings"
                className="block p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl border-2 border-orange-200 transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      Gestionare Pre-Rezervări
                    </h4>
                    <p className="text-sm text-gray-600">
                      Aprobă sau respinge pre-rezervări
                    </p>
                  </div>
                </div>
              </Link>

              {/* TODO: Add more admin actions */}
              <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 opacity-50">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🏢</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Gestionare Agenții
                    </h4>
                    <p className="text-sm text-gray-600">
                      În curând...
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 opacity-50">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">📊</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Statistici
                    </h4>
                    <p className="text-sm text-gray-600">
                      În curând...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>📈</span>
              <span>Statistici Rapide</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">-</div>
                <div className="text-sm text-gray-600">Agenții Active</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">-</div>
                <div className="text-sm text-gray-600">În Așteptare</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">-</div>
                <div className="text-sm text-gray-600">Rezervări</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">-</div>
                <div className="text-sm text-gray-600">Venit Total</div>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-gray-500">
              Statisticile vor fi populate în curând
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}