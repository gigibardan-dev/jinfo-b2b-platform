/**
 * GET /api/v1/circuits/[slug]
 * J'Info B2B Platform - Detalii circuit complet cu toate plecările
 *
 * Headers necesare:
 *   X-API-Key: {api_key}
 *
 * Parametru URL:
 *   slug → identificatorul unic al circuitului (ex: "andaluzia-5-nopti")
 *
 * Exemplu request:
 *   GET /api/v1/circuits/andaluzia-5-nopti
 *
 * Exemplu răspuns succes:
 * {
 *   "success": true,
 *   "data": {
 *     "circuit": { ...date complete + toate departures }
 *   }
 * }
 *
 * Exemplu răspuns 404:
 * {
 *   "success": false,
 *   "error": "Not Found",
 *   "message": "Circuitul nu există sau nu este activ."
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateApiKey,
  unauthorizedResponse,
  serverErrorResponse
} from '@/lib/api/validateApiKey';

// Supabase cu SERVICE_ROLE_KEY (server-side only)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // ── Autentificare
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Slug lipsă.' },
        { status: 400 }
      );
    }

    // ── Query circuit cu toate departures (inclusiv sold_out pentru detalii complete)
    const { data: circuit, error } = await supabase
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
        gallery,
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
          available_spots,
          min_participants
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !circuit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Circuitul nu există sau nu este activ.'
        },
        { status: 404 }
      );
    }

    // ── Sortează departures după dată
    const sortedDepartures = (circuit.departures || [])
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
        available_spots: d.available_spots ?? null,
        min_participants: d.min_participants ?? null
      }));

    // ── Statistici rapide despre disponibilitate
    const availableCount = sortedDepartures.filter(
      (d: any) => d.status === 'available' || d.status === 'limited'
    ).length;

    const nextDeparture = sortedDepartures.find(
      (d: any) => d.status !== 'sold_out' &&
        new Date(d.departure_date) >= new Date()
    ) || null;

    // ── Formatează răspunsul complet
    const formattedCircuit = {
      id: circuit.external_id || circuit.id,
      slug: circuit.slug,
      name: circuit.name,
      title: circuit.title ?? null,
      continent: circuit.continent ?? null,
      nights: circuit.nights ?? null,
      url: circuit.url ?? null,
      image: circuit.main_image ?? null,
      gallery: circuit.gallery || [],
      description: circuit.short_description ?? null,
      prices: {
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
      availability: {
        total_departures: sortedDepartures.length,
        available_departures: availableCount,
        next_departure: nextDeparture ? {
          date: nextDeparture.departure_date,
          return_date: nextDeparture.return_date,
          price: nextDeparture.price,
          status: nextDeparture.status
        } : null
      },
      departures: sortedDepartures,
      last_updated: circuit.last_scraped ?? null
    };

    return NextResponse.json({
      success: true,
      data: {
        circuit: formattedCircuit
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return serverErrorResponse();
  }
}