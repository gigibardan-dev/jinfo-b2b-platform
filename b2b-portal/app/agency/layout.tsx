import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Only agencies can access this section
  if (role !== 'agency') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <Header role="agency" />
      
      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}