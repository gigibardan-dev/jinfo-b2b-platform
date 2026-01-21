import { createClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function getUserRole(userId: string) {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (adminProfile) {
    return adminProfile.role; // 'admin', 'operator', 'superadmin'
  }
  
  // Check if user is agency
  const { data: agency } = await supabase
    .from('agencies')
    .select('status')
    .eq('id', userId)
    .single();
  
  if (agency) {
    return agency.status === 'active' ? 'agency' : 'agency_pending';
  }
  
  return null;
}