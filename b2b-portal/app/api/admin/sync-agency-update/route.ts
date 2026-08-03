// app/api/admin/sync-agency-update/route.ts — B2B
// Trimite update date agenție spre jinfocruise când adminul editează din modal

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return ['admin', 'superadmin'].includes(profile?.role ?? '');
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, ...updateFields } = body;

    if (!email) {
      return NextResponse.json({ error: 'email obligatoriu' }, { status: 400 });
    }

    const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
    const b2bApiKey = process.env.JINFO_API_KEY;

    if (!jinfocruiseUrl || !b2bApiKey) {
      console.warn('[sync-agency-update] Env vars lipsă — skip');
      return NextResponse.json({ success: false, skipped: true });
    }

    const res = await fetch(`${jinfocruiseUrl}/api/b2b/update-agency`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-B2B-Secret': b2bApiKey,
      },
      body: JSON.stringify({ email, ...updateFields }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('[sync-agency-update] Eșuat:', data?.error);
      return NextResponse.json({ success: false, error: data?.error }, { status: 502 });
    }

    console.log(`[sync-agency-update] ✓ ${email} → jinfocruise`);
    return NextResponse.json({ success: true });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-agency-update] Eroare:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}