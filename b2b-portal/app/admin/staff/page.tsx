import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import StaffPageClient from '@/components/admin/staff/StaffPageClient';

export default async function StaffPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Doar superadmin poate accesa această pagină
  if (role !== 'superadmin') {
    redirect('/admin/dashboard');
  }

  return <StaffPageClient currentUserId={user.id} />;
}