import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Only admins can access this section
  if (role !== 'admin' && role !== 'superadmin' && role !== 'operator') {
    redirect('/dashboard');
  }

  return (
    <>
      <Header />

      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6 py-3">
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/bookings"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Bookings
            </Link>
            <Link
              href="/admin/payments"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Payments
            </Link>
            <Link
              href="/admin/agencies"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Agencies
            </Link>
            <Link
              href="/admin/create-agency"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Create Agency
            </Link>
          </nav>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>

      <Footer />
    </>
  );
}
