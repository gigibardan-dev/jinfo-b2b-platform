// app/api/admin/sync-to-jinfocruise/route.ts — b2b
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificare simplă cu secret intern
    const secret = request.headers.get('X-Sync-Secret');
    if (!secret || secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, company_name, contact_person, phone, commission_pct, password } = body;

    if (!email || !company_name) {
      return NextResponse.json({ error: 'email și company_name sunt obligatorii' }, { status: 400 });
    }

    const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
    const b2bApiKey      = process.env.JINFO_API_KEY;

    if (!jinfocruiseUrl || !b2bApiKey) {
      console.warn('[sync-to-jinfocruise] Env vars lipsă — skip');
      return NextResponse.json({ success: false, skipped: true, message: 'Env vars lipsă' });
    }

    const res = await fetch(`${jinfocruiseUrl}/api/b2b/create-agency-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-B2B-Secret': b2bApiKey,
      },
      body: JSON.stringify({ email, company_name, contact_person, phone, commission_pct, password }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('[sync-to-jinfocruise] Eșuat:', data?.error);
      return NextResponse.json({ success: false, error: data?.error }, { status: 502 });
    }

    console.log(`[sync-to-jinfocruise] ✓ ${email} → jinfocruise`);
    return NextResponse.json({ success: true, is_new: data.is_new });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-to-jinfocruise] Eroare:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}