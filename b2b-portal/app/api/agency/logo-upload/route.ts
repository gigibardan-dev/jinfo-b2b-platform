// app/api/agency/logo-upload/route.ts — B2B
// Upload logo pentru agenția proprie — verifică că userul e agentul respectiv

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const BUCKET = 'agency-logos';
const MAX_SIZE = 512 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifică rol
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['agency', 'admin', 'superadmin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const agencyId = formData.get('agencyId') as string | null;

    if (!file) return NextResponse.json({ error: 'Fișier lipsă' }, { status: 400 });
    if (!agencyId) return NextResponse.json({ error: 'agencyId lipsă' }, { status: 400 });

    // Dacă e agency, verifică că uploadează pentru propria agenție
    if (profile?.role === 'agency') {
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (agency?.id !== agencyId) {
        return NextResponse.json({ error: 'Nu poți modifica logo-ul altei agenții' }, { status: 403 });
      }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tip fișier neacceptat. Acceptăm: JPG, PNG, WebP, SVG' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fișierul depășește 512 KB.' }, { status: 400 });
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/jpg': 'jpg',
      'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg',
    };
    const ext = extMap[file.type] ?? 'png';
    const filePath = `${agencyId}/logo.${ext}`;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: 'Eroare la upload: ' + uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: `${urlData.publicUrl}?t=${Date.now()}`,
      path: filePath,
    });

  } catch (error) {
    console.error('[agency/logo-upload] Eroare:', error);
    return NextResponse.json({ error: 'Eroare internă server' }, { status: 500 });
  }
}