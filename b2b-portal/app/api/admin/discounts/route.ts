import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── Tipuri locale ────────────────────────────────────────────────────────────

type ApplyDiscountBody = {
  circuitIds: string[]        // UUID-uri din Supabase (nu external_id)
  discountPercentage: number  // ex: 10 = 10%
  validUntil?: string | null  // ISO string sau null = fără expirare
}

type RemoveDiscountBody = {
  circuitIds: string[]        // UUID-uri din Supabase
}

// ── Helper: verificare rol admin/superadmin ──────────────────────────────────

async function verifyAdminRole(supabase: any): Promise<{ error: NextResponse | null }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    };
  }

  return { error: null };
}

// ── GET: lista circuitelor cu status reduceri ────────────────────────────────
// Folosit de pagina /admin/discounts pentru a popula tabelul

export async function GET() {
  try {
    const supabase = await createClient();

    const { error: authError } = await verifyAdminRole(supabase);
    if (authError) return authError;

    const { data: circuits, error } = await supabase
      .from('circuits')
      .select(`
        id,
        external_id,
        slug,
        name,
        continent,
        is_active,
        price_double,
        price_single,
        price_triple,
        price_child,
        is_discounted,
        discount_percentage,
        discount_valid_until
      `)
      .eq('is_active', true)
      .order('continent', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching circuits for discounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch circuits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, circuits });

  } catch (error) {
    console.error('GET /api/admin/discounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── POST: aplică reducere pe unul sau mai multe circuite ─────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { error: authError } = await verifyAdminRole(supabase);
    if (authError) return authError;

    const body: ApplyDiscountBody = await request.json();
    const { circuitIds, discountPercentage, validUntil } = body;

    // Validări
    if (!circuitIds || circuitIds.length === 0) {
      return NextResponse.json(
        { error: 'circuitIds este obligatoriu și trebuie să conțină cel puțin un ID' },
        { status: 400 }
      );
    }

    if (discountPercentage === undefined || discountPercentage === null) {
      return NextResponse.json(
        { error: 'discountPercentage este obligatoriu' },
        { status: 400 }
      );
    }

    if (discountPercentage <= 0 || discountPercentage >= 100) {
      return NextResponse.json(
        { error: 'discountPercentage trebuie să fie între 1 și 99' },
        { status: 400 }
      );
    }

    // Validare dată expirare dacă e furnizată
    if (validUntil) {
      const parsedDate = new Date(validUntil);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'validUntil nu este o dată validă' },
          { status: 400 }
        );
      }
      if (parsedDate <= new Date()) {
        return NextResponse.json(
          { error: 'validUntil trebuie să fie în viitor' },
          { status: 400 }
        );
      }
    }

    // Aplică reducerea
    // valid_until: dacă e furnizat → salvăm la 23:59:59 în ora României
    // dacă nu → null (fără expirare)
    let validUntilValue: string | null = null;
    if (validUntil) {
      // Setăm ora la 23:59:59 în timezone România
      const date = new Date(validUntil);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      // Salvăm ca timestamp cu timezone România explicit
      validUntilValue = `${year}-${month}-${day}T23:59:59+03:00`;
    }

    const { data, error } = await supabase
      .from('circuits')
      .update({
        is_discounted:        true,
        discount_percentage:  discountPercentage,
        discount_valid_until: validUntilValue,
        updated_at:           new Date().toISOString()
      })
      .in('id', circuitIds)
      .select('id, name, discount_percentage, discount_valid_until');

    if (error) {
      console.error('Error applying discount:', error);
      return NextResponse.json(
        { error: 'Failed to apply discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data?.length ?? 0,
      circuits: data
    });

  } catch (error) {
    console.error('POST /api/admin/discounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── DELETE: șterge reducerea de pe unul sau mai multe circuite ───────────────

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const { error: authError } = await verifyAdminRole(supabase);
    if (authError) return authError;

    const body: RemoveDiscountBody = await request.json();
    const { circuitIds } = body;

    if (!circuitIds || circuitIds.length === 0) {
      return NextResponse.json(
        { error: 'circuitIds este obligatoriu și trebuie să conțină cel puțin un ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('circuits')
      .update({
        is_discounted:        false,
        discount_percentage:  null,
        discount_valid_until: null,
        updated_at:           new Date().toISOString()
      })
      .in('id', circuitIds)
      .select('id, name');

    if (error) {
      console.error('Error removing discount:', error);
      return NextResponse.json(
        { error: 'Failed to remove discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data?.length ?? 0,
      circuits: data
    });

  } catch (error) {
    console.error('DELETE /api/admin/discounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}