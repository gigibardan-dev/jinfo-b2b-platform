/**
 * GET /api/v1/circuits
 * J'Info B2B Platform - Lista circuite active cu prețuri și disponibilități
 *
 * Headers necesare:
 *   X-API-Key: {api_key}
 *
 * Query params opționali:
 *   ?continent=europa       → filtrează după continent
 *   ?search=andaluzia       → caută în nume
 *   ?page=1&limit=20        → paginare (default: page=1, limit=20)
 *
 * Exemplu răspuns:
 * {
 *   "success": true,
 *   "data": {
 *     "circuits": [...],
 *     "pagination": { "total": 101, "page": 1, "limit": 20, "pages": 6 }
 *   }
 * }
 *
 * Securitate:
 *   - Folosim SERVICE_ROLE_KEY (server-side only, nu NEXT_PUBLIC_)
 *   - Singura poartă de intrare e API-ul nostru cu X-API-Key
 *   - URL-ul Supabase nu e expus clientului
 *
 * TO DO (când volumul crește):
 *   - Filtrare departures sold_out direct în query Supabase
 *   - Indecși pe is_active, continent, name (GIN pentru ilike)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateApiKey,
  unauthorizedResponse,
  serverErrorResponse
} from '@/lib/api/validateApiKey';

// ── Supabase cu SERVICE_ROLE_KEY (server-side only, bypass RLS)
// NU folosim NEXT_PUBLIC_ aici - acest fișier rulează doar pe server
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  // ── Autentificare
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    // ── Query params
    const continent = searchParams.get('continent');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // ── Query de bază
    let query = supabase
      .from('circuits')
      .select(`
        id,
        external_id,
        slug,
        name,
        title,
        continent,
        nights,
        url,
        main_image,
        short_description,
        price_double,
        price_single,
        price_triple,
        price_child,
        price_options,
        discount_percentage,
        discount_valid_from,
        discount_valid_until,
        last_scraped,
        departures (
          id,
          departure_date,
          return_date,
          room_type,
          price,
          status,
          available_spots
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // ── Filtre opționale
    if (continent) {
      query = query.eq('continent', continent.toLowerCase());
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: circuits, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return serverErrorResponse('Eroare la încărcarea circuitelor');
    }

    // ── Formatează răspunsul
    const formattedCircuits = (circuits || []).map(circuit => ({
      id: circuit.external_id || circuit.id,
      slug: circuit.slug,
      name: circuit.name,
      title: circuit.title ?? null,
      continent: circuit.continent ?? null,
      nights: circuit.nights ?? null,
      url: circuit.url ?? null,
      image: circuit.main_image ?? null,
      description: circuit.short_description ?? null,
      prices: {
        // Null explicit dacă nu există - QuickSell să decidă cum afișează
        double: circuit.price_double ?? null,
        single: circuit.price_single ?? null,
        triple: circuit.price_triple ?? null,
        child: circuit.price_child ?? null,
        options: circuit.price_options || []
      },
      discount: circuit.discount_percentage ? {
        percentage: circuit.discount_percentage,
        valid_from: circuit.discount_valid_from ?? null,
        valid_until: circuit.discount_valid_until ?? null
      } : null,
      // Filtrăm sold_out în JS (volume mic ~425 departures)
      // TO DO: mută filtrul în query când volumul crește
      departures: (circuit.departures || [])
        .filter((d: any) => d.status !== 'sold_out')
        .sort((a: any, b: any) =>
          new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
        )
        .map((d: any) => ({
          id: d.id,
          departure_date: d.departure_date,
          return_date: d.return_date,
          room_type: d.room_type,
          price: d.price ?? null,
          status: d.status,
          available_spots: d.available_spots ?? null
        })),
      last_updated: circuit.last_scraped ?? null
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        circuits: formattedCircuits,
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: totalPages
        }
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return serverErrorResponse();
  }
}