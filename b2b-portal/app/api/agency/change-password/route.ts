// app/api/agency/change-password/route.ts — B2B
// Schimbă parola agentului + sincronizează în JinfoCruise

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verifică că e logat
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Parola curentă și cea nouă sunt obligatorii' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Parola nouă trebuie să aibă minim 8 caractere' },
        { status: 400 }
      );
    }

    // Verifică parola curentă prin signIn
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Parola curentă este incorectă' },
        { status: 400 }
      );
    }

    // Schimbă parola în Supabase B2B
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[agency/change-password] Eroare update parolă B2B:', updateError);
      return NextResponse.json(
        { error: 'Eroare la schimbarea parolei' },
        { status: 500 }
      );
    }

    // ── Sync parolă spre JinfoCruise ─────────────────────────────────────────
    // Fire-and-forget — nu blocăm răspunsul spre client dacă sync-ul eșuează
    const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
    const b2bApiKey = process.env.JINFO_API_KEY;

    if (jinfocruiseUrl && b2bApiKey && user.email) {
      fetch(`${jinfocruiseUrl}/api/b2b/sync-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-B2B-Secret': b2bApiKey,
        },
        body: JSON.stringify({
          email: user.email,
          password: newPassword,
        }),
        signal: AbortSignal.timeout(10_000),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.error('[agency/change-password] Sync JinfoCruise eșuat:', data?.error);
          } else {
            console.log(`[agency/change-password] ✓ Parolă sincronizată JinfoCruise: ${user.email}`);
          }
        })
        .catch((err) => {
          console.error('[agency/change-password] Eroare sync JinfoCruise:', err);
        });
    } else {
      console.warn('[agency/change-password] Env vars lipsă — sync JinfoCruise skipped');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[agency/change-password] Eroare internă:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}