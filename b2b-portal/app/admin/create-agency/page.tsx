import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import CreateAgencyForm from '@/app/admin/create-agency/CreateAgencyForm';
import Link from 'next/link';

export default async function AdminCreateAgencyPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          href="/admin/agencies" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold shadow-md border border-gray-200"
        >
          <span>←</span>
          <span>Înapoi la Agenții</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              👨‍💼
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Creare Agenție Nouă
              </h1>
              <p className="text-purple-100 text-sm">
                Creează direct un cont de agenție pre-validat
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-2">
                Agenția va fi pre-validată automat
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Status: <strong>"active"</strong> (nu "pending")</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Email de bun venit trimis automat</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Poate crea imediat pre-rezervări</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <CreateAgencyForm adminUserId={user.id} />
        </div>
      </div>
    </div>
  );
}