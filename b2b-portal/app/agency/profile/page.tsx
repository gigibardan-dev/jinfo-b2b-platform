// app/agency/profile/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AgencyProfileForm from './AgencyProfileForm';

export default async function AgencyProfilePage() {
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
                <div className="text-5xl">🏢</div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Profilul Agenției
                  </h1>
                  <p className="text-orange-100">
                    {agencyData.company_name}
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
                    Actualizează datele agenției tale
                  </h3>
                  <p className="text-blue-800">
                    Asigură-te că toate informațiile sunt corecte și actualizate.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8">
              <AgencyProfileForm agencyData={agencyData} userId={user.id} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}