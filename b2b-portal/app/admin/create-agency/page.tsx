import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CreateAgencyForm from '@/app/admin/create-agency/CreateAgencyForm';

export default async function AdminCreateAgencyPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Only admins can access this page
  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/dashboard');
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <a 
              href="/dashboard" 
              className="text-orange-500 hover:text-orange-600 inline-flex items-center gap-2 font-medium transition-colors"
            >
              <span>←</span>
              <span>Înapoi la Dashboard</span>
            </a>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">👨‍💼</div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Creare Agenție Nouă
                  </h1>
                  <p className="text-orange-100">
                    Creează direct un cont de agenție validat (doar pentru admini)
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-b border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">ℹ️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2 text-lg">
                    Agenția va fi pre-validată automat
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Status: <strong>"active"</strong> (nu "pending")</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Email de bun venit trimis automat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Poate crea imediat pre-rezervări</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8">
              <CreateAgencyForm adminUserId={user.id} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}