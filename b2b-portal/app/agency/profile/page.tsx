// app/agency/profile/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import AgencyProfileForm from './AgencyProfileForm';
import Link from 'next/link';

export default async function AgencyProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  if (role !== 'agency') {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: agencyData, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !agencyData) {
    console.error('Error fetching agency data:', error);
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          href="/agency" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold shadow-md border border-gray-200"
        >
          <span>←</span>
          <span>Înapoi la Dashboard</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              🏢
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Profilul Agenției
              </h1>
              <p className="text-orange-100 text-sm">
                {agencyData.company_name}
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-1">
                Actualizează datele agenției tale
              </h3>
              <p className="text-sm text-blue-800">
                Asigură-te că toate informațiile sunt corecte și actualizate pentru o colaborare optimă.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <AgencyProfileForm agencyData={agencyData} userId={user.id} />
        </div>
      </div>
    </div>
  );
}