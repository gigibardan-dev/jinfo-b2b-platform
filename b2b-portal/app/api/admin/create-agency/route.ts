// app/api/admin/create-agency/route.ts
// Creează agenție complet pe server cu supabaseAdmin
// — nu schimbă sesiunea adminului care face request-ul
// — upload logo cu service role
// — sync spre jinfocruise

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const BUCKET = 'agency-logos';
const MAX_SIZE = 512 * 1024; // 512 KB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
  // 1. Verifică că cel care face request-ul e admin/superadmin
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const formData = await request.formData();

    // Extrage câmpurile text
    const email           = formData.get('email') as string;
    const password        = formData.get('password') as string;
    const agency_display_name = formData.get('agency_display_name') as string;
    const company_name    = formData.get('company_name') as string;
    const trade_register  = formData.get('trade_register') as string;
    const registration_number = formData.get('registration_number') as string | null;
    const contact_person  = formData.get('contact_person') as string;
    const phone           = formData.get('phone') as string;
    const billing_address = formData.get('billing_address') as string;
    const billing_city    = formData.get('billing_city') as string;
    const billing_county  = formData.get('billing_county') as string | null;
    const billing_postal_code = formData.get('billing_postal_code') as string | null;
    const bank_name       = formData.get('bank_name') as string | null;
    const bank_account    = formData.get('bank_account') as string | null;
    const commission_rate = parseFloat(formData.get('commission_rate') as string ?? '10');
    const adminUserId     = formData.get('adminUserId') as string;
    const logoFile        = formData.get('logo') as File | null;

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'Email, parolă și nume companie sunt obligatorii' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Parola trebuie să aibă minim 8 caractere' }, { status: 400 });
    }

    // 2. Creare user în Auth — fără a afecta sesiunea curentă
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_name },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Eroare creare user' }, { status: 500 });
    }

    const userId = authData.user.id;

    // 3. Upload logo dacă există (service role — nu depinde de sesiune)
    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > MAX_SIZE) {
        // Rollback user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: 'Logo depășește 512 KB' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.includes(logoFile.type)) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: 'Tip fișier neacceptat pentru logo' }, { status: 400 });
      }

      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/jpg': 'jpg',
        'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg',
      };
      const ext = extMap[logoFile.type] ?? 'png';
      const filePath = `${userId}/logo.${ext}`;

      const buffer = new Uint8Array(await logoFile.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: logoFile.type, upsert: true });

      if (uploadError) {
        console.error('[create-agency] Upload logo error:', uploadError);
        // Nu blocăm crearea agenției dacă logo-ul eșuează
      } else {
        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }
    }

    // 4. Insert în agencies
    const { error: agencyError } = await supabaseAdmin
      .from('agencies')
      .insert({
        id: userId,
        user_id: userId,
        agency_display_name: agency_display_name || null,
        company_name,
        logo_url: logoUrl,
        trade_register,
        registration_number: registration_number || null,
        contact_person,
        phone,
        email,
        billing_address,
        billing_city,
        billing_county: billing_county || null,
        billing_postal_code: billing_postal_code || null,
        bank_name: bank_name || null,
        bank_account: bank_account || null,
        commission_rate,
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: adminUserId || null,
      });

    if (agencyError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: agencyError.message }, { status: 500 });
    }

    // 5. Insert în user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({ id: userId, role: 'agency' });

    if (profileError) {
      console.error('[create-agency] user_profiles error:', profileError);
    }

    // 6. Sync spre jinfocruise — await explicit ca Vercel să nu taie execuția
    const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
    const b2bApiKey = process.env.JINFO_API_KEY;

    if (jinfocruiseUrl && b2bApiKey) {
      try {
        const syncRes = await fetch(`${jinfocruiseUrl}/api/b2b/create-agency-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-B2B-Secret': b2bApiKey,
          },
          body: JSON.stringify({
            email,
            company_name,
            agency_display_name: agency_display_name || null,
            logo_url: logoUrl,
            contact_person,
            phone,
            commission_pct: commission_rate,
            password,
            trade_register: trade_register || null,
            registration_number: registration_number || null,
            billing_address: billing_address || null,
            billing_city: billing_city || null,
            billing_county: billing_county || null,
            billing_postal_code: billing_postal_code || null,
            bank_name: bank_name || null,
            bank_account: bank_account || null,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        const syncData = await syncRes.json();
        console.log(`[create-agency] Sync jinfocruise: ${syncData.success ? '✓' : '✗'} ${email}`, syncData);
      } catch (syncErr) {
        console.error('[create-agency] Sync jinfocruise error:', syncErr);
        // Nu blocăm — agenția e creată în B2B, sync-ul poate fi refăcut manual
      }
    } else {
      console.warn('[create-agency] JINFOCRUISE_URL sau JINFO_API_KEY lipsă — sync skipped');
    }

    return NextResponse.json({
      success: true,
      userId,
      agency_display_name: agency_display_name || company_name,
    }, { status: 201 });

  } catch (error) {
    console.error('[create-agency] Eroare neașteptată:', error);
    return NextResponse.json({ error: 'Eroare internă server' }, { status: 500 });
  }
}