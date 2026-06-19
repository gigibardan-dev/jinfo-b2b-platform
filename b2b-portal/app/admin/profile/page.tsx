import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import AdminProfileClient from './AdminProfileClient';

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function AdminProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);

  if (role !== 'admin' && role !== 'superadmin' && role !== 'operator') {
    redirect('/dashboard');
  }

  // Ia full_name din user_profiles
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Ia emailul din auth.users via admin client
  const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(user.id);

  return (
    <AdminProfileClient
      userId={user.id}
      email={authUser?.email || user.email || ''}
      fullName={profile?.full_name || null}
      role={profile?.role || role || 'admin'}
    />
  );
}