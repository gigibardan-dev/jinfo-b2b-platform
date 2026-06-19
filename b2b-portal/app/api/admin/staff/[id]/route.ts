import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getSuperAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'superadmin' ? user.id : null;
}

// PATCH — schimbă rolul SAU resetează parola
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = await getSuperAdminId();
  if (!currentUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Nu poți modifica propriul cont
  if (id === currentUserId) {
    return NextResponse.json({ error: 'Nu poți modifica propriul cont' }, { status: 400 });
  }

  const body = await request.json();
  const { role, full_name, newPassword } = body;

  // ── Reset parolă
  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Parola trebuie să aibă minim 8 caractere' },
        { status: 400 }
      );
    }

    const { error } = await adminClient.auth.admin.updateUserById(id, {
      password: newPassword,
    });

    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json({ error: 'Eroare la resetarea parolei' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ── Schimbare rol / nume
  if (role && !['admin', 'operator'].includes(role)) {
    return NextResponse.json({ error: 'Rol invalid. Poate fi admin sau operator' }, { status: 400 });
  }

  // Nu poți modifica un superadmin
  const { data: targetProfile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', id)
    .single();

  if (targetProfile?.role === 'superadmin') {
    return NextResponse.json({ error: 'Nu poți modifica un superadmin' }, { status: 400 });
  }

  const updateData: any = { updated_at: new Date().toISOString() };
  if (role) updateData.role = role;
  if (full_name !== undefined) updateData.full_name = full_name;

  const { error } = await adminClient
    .from('user_profiles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Eroare la actualizare' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — șterge user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = await getSuperAdminId();
  if (!currentUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUserId) {
    return NextResponse.json({ error: 'Nu poți șterge propriul cont' }, { status: 400 });
  }

  // Nu poți șterge un superadmin
  const { data: targetProfile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', id)
    .single();

  if (targetProfile?.role === 'superadmin') {
    return NextResponse.json({ error: 'Nu poți șterge un superadmin' }, { status: 400 });
  }

  const { error } = await adminClient.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: 'Eroare la ștergere' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}