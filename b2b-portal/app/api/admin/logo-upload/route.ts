// app/api/admin/logo-upload/route.ts
// Upload logo agenție în Supabase Storage (bucket: agency-logos)
// Returnează URL-ul public al fișierului

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'agency-logos';
const MAX_SIZE = 512 * 1024; // 512 KB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth + rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((['admin', 'superadmin'].includes(profile?.role ?? '')) === false) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parsează form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const agencyId = formData.get('agencyId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Fișier lipsă' }, { status: 400 });
    }

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId lipsă' }, { status: 400 });
    }

    // Validare tip
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tip fișier neacceptat. Acceptăm: JPG, PNG, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validare dimensiune
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Fișierul depășește 512 KB. Comprimă logo-ul înainte de upload.' },
        { status: 400 }
      );
    }

    // Extensie din MIME type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg':  'jpg',
      'image/png':  'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    const ext = extMap[file.type] ?? 'png';

    // Cale unică per agenție — suprascrie la re-upload (înlocuire)
    const filePath = `${agencyId}/logo.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload (upsert = înlocuiește dacă există)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[logo-upload] Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Eroare la upload: ' + uploadError.message },
        { status: 500 }
      );
    }

    // URL public
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Adaugă cache-bust ca să forțeze refresh în browser după înlocuire
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    return NextResponse.json({
      success: true,
      url: urlWithBust,
      path: filePath,
    });

  } catch (error) {
    console.error('[logo-upload] Eroare neașteptată:', error);
    return NextResponse.json({ error: 'Eroare internă server' }, { status: 500 });
  }
}