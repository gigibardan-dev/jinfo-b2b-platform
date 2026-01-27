import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
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
    <div className="min-h-screen flex flex-col">
      {/* Admin Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6 py-4">
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

      {/* Content */}
      <div className="flex-1 bg-gray-50">
        {children}
      </div>
    </div>
  );
}
