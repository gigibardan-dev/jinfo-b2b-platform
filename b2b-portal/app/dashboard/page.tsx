import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  // Redirect to appropriate dashboard based on role
  if (role === 'admin' || role === 'superadmin' || role === 'operator') {
    redirect('/admin/dashboard');
  }

  if (role === 'agency') {
    redirect('/agency/dashboard');
  }

  if (role === 'agency_pending') {
    // For pending agencies, show a waiting page
    redirect('/auth/pending');
  }

  // Fallback - should not reach here
  redirect('/auth/login');
}