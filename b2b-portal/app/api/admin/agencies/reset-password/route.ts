// app/api/admin/agencies/reset-password/route.ts — B2B
// Reset parolă agenție de către admin + sync spre JinfoCruise

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Verifică că e logat și e admin/superadmin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }

    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'userId și newPassword sunt obligatorii' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Parola trebuie să aibă minim 8 caractere' },
        { status: 400 }
      );
    }

    // Verifică că userul țintă e o agenție — nu resetăm parola staff-ului de aici
    const { data: targetProfile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!targetProfile || targetProfile.role !== 'agency') {
      return NextResponse.json(
        { error: 'Userul nu este o agenție' },
        { status: 400 }
      );
    }

    // Găsim emailul agenției — necesar pentru sync JinfoCruise
    const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(userId);
    const agencyEmail = targetUser?.email;

    if (!agencyEmail) {
      return NextResponse.json(
        { error: 'Nu s-a putut determina emailul agenției' },
        { status: 400 }
      );
    }

    // Resetăm parola în Supabase B2B
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[admin/agencies/reset-password] Eroare update parolă:', updateError);
      return NextResponse.json(
        { error: 'Eroare la resetarea parolei' },
        { status: 500 }
      );
    }

    console.log(`[admin/agencies/reset-password] Parolă resetată pentru: ${agencyEmail}`);

    // ── Sync parolă spre JinfoCruise ─────────────────────────────────────────
    const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
    const b2bApiKey = process.env.JINFO_API_KEY;

    if (jinfocruiseUrl && b2bApiKey) {
      fetch(`${jinfocruiseUrl}/api/b2b/sync-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-B2B-Secret': b2bApiKey,
        },
        body: JSON.stringify({ email: agencyEmail, password: newPassword }),
        signal: AbortSignal.timeout(10_000),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.error('[admin/agencies/reset-password] Sync JinfoCruise eșuat:', data?.error);
          } else {
            console.log(`[admin/agencies/reset-password] ✓ Sync JinfoCruise: ${agencyEmail}`);
          }
        })
        .catch((err) => {
          console.error('[admin/agencies/reset-password] Eroare sync JinfoCruise:', err);
        });
    } else {
      console.warn('[admin/agencies/reset-password] Env vars lipsă — sync JinfoCruise skipped');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[admin/agencies/reset-password] Eroare internă:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}