import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Admin client cu service_role pentru operații pe auth.users
const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'superadmin';
}

// GET — lista staff (admin + operator + superadmin)
export async function GET() {
  if (!await isSuperAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, created_at, updated_at')
    .in('role', ['superadmin', 'admin', 'operator'])
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  // Adaugă email din auth.users pentru fiecare profil
  const staffWithEmail = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: { user } } = await adminClient.auth.admin.getUserById(profile.id);
      return {
        ...profile,
        email: user?.email || 'N/A',
      };
    })
  );

  return NextResponse.json({ success: true, data: staffWithEmail });
}

// POST — creare user nou (admin sau operator)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!await isSuperAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, role } = body;

  // Validări
  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Email, parolă și rol sunt obligatorii' }, { status: 400 });
  }

  if (!['admin', 'operator'].includes(role)) {
    return NextResponse.json({ error: 'Rol invalid. Poate fi admin sau operator' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Parola trebuie să aibă minim 8 caractere' }, { status: 400 });
  }

  try {
    // 1. Creează user în auth.users
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirmat automat, nu trimite email
    });

    if (createError || !newUser.user) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { error: createError?.message || 'Eroare la crearea userului' },
        { status: 500 }
      );
    }

    // 2. Creează profil în user_profiles
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        full_name: full_name || null,
        role,
      });

    if (profileError) {
      // Rollback — șterge userul creat
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      console.error('Profile insert error:', profileError);
      return NextResponse.json({ error: 'Eroare la crearea profilului' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: full_name || null,
        role,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Staff create error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}