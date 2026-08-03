// app/api/agency/sync-profile/route.ts — B2B
// Sync date agenție spre jinfocruise când agentul editează profilul
// Verifică că userul logat e chiar agentul care face update (nu altcineva)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifică că userul are rol agency
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['agency', 'admin', 'superadmin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  // Preluăm emailul agenției din DB — nu îl luăm din body ca să nu poată fi falsificat
  const { data: agency } = await supabase
    .from('agencies')
    .select('email')
    .eq('user_id', user.id)
    .single();

  if (!agency?.email) {
    return NextResponse.json({ error: 'Agenție negăsită' }, { status: 404 });
  }

  try {
    const body = await request.json();

    const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
    const b2bApiKey = process.env.JINFO_API_KEY;

    if (!jinfocruiseUrl || !b2bApiKey) {
      console.warn('[agency/sync-profile] Env vars lipsă — skip');
      return NextResponse.json({ success: false, skipped: true });
    }

    const res = await fetch(`${jinfocruiseUrl}/api/b2b/update-agency`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-B2B-Secret': b2bApiKey,
      },
      body: JSON.stringify({
        email: agency.email, // din DB, nu din body
        ...body,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('[agency/sync-profile] Eșuat:', data?.error);
      return NextResponse.json({ success: false, error: data?.error }, { status: 502 });
    }

    console.log(`[agency/sync-profile] ✓ ${agency.email} → jinfocruise`);
    return NextResponse.json({ success: true });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[agency/sync-profile] Eroare:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}