/**
 * POST /api/v1/bookings
 * J'Info B2B Platform - Primește rezervare din QuickSell
 *
 * Headers necesare:
 *   X-API-Key: {api_key}
 *   Content-Type: application/json
 *
 * Body exemplu:
 * {
 *   "departure_id": "uuid-departure",        ← ID-ul plecării din GET /circuits/[slug]
 *   "circuit_id": "uuid-circuit",            ← ID-ul extern al circuitului (external_id)
 *   "agency_email": "agentie@example.com",   ← email agenție pentru mapare
 *   "num_adults": 2,
 *   "num_children": 1,
 *   "room_type": "double",
 *   "passengers": [
 *     { "name": "Ion Popescu", "age": "35", "passport": "RO123456" },
 *     { "name": "Maria Popescu", "age": "32", "passport": "RO654321" }
 *   ],
 *   "agency_notes": "Notițe opționale",
 *   "qtravel_booking_id": "QT-2026-XXXXX"    ← ID rezervare din QuickSell
 * }
 *
 * Mapare agenție:
 *   1. Caută agenția după agency_email în tabelul agencies
 *   2. Dacă găsește → asociază rezervarea la agenția respectivă
 *   3. Dacă nu găsește → returnează 422 cu mesaj clar
 *
 * Răspuns succes (201):
 * {
 *   "success": true,
 *   "data": {
 *     "booking_number": "JI-2026-XXXX",
 *     "status": "pending",
 *     "message": "Rezervarea a fost creată și așteaptă aprobare."
 *   }
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

export async function POST(request: NextRequest) {
  // ── Autentificare
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    // ── Validare câmpuri obligatorii
    const required = ['departure_id', 'agency_email', 'num_adults', 'room_type', 'passengers'];
    const missing = required.filter(field => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Câmpuri obligatorii lipsă: ${missing.join(', ')}`
        },
        { status: 400 }
      );
    }

    // ── Validare passengers
    if (!Array.isArray(body.passengers) || body.passengers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Lista de pasageri este goală sau invalidă.'
        },
        { status: 400 }
      );
    }

    // ── Validare num_adults
    if (typeof body.num_adults !== 'number' || body.num_adults < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'num_adults trebuie să fie minim 1.'
        },
        { status: 400 }
      );
    }

    // ── MAPARE AGENȚIE după email
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, company_name, commission_rate, approved_at, suspended_at')
      .eq('email', body.agency_email.toLowerCase().trim())
      .maybeSingle();

    if (agencyError) {
      console.error('Agency lookup error:', agencyError);
      return serverErrorResponse('Eroare la căutarea agenției.');
    }

    if (!agency) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unprocessable Entity',
          message: `Agenția cu email-ul "${body.agency_email}" nu este înregistrată în platformă. Contactați J'Info Tours pentru înregistrare.`
        },
        { status: 422 }
      );
    }

    // ── Verifică dacă agenția e activă (aprobată și nesuspendată)
    if (!agency.approved_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Agenția nu este aprobată încă în platformă.'
        },
        { status: 403 }
      );
    }

    if (agency.suspended_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Agenția este suspendată. Contactați J\'Info Tours.'
        },
        { status: 403 }
      );
    }

    // ── Verifică departure există și e disponibil
    const { data: departure, error: departureError } = await supabase
      .from('departures')
      .select('id, circuit_id, departure_date, return_date, price, status, available_spots')
      .eq('id', body.departure_id)
      .maybeSingle();

    if (departureError || !departure) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Plecarea specificată nu există.'
        },
        { status: 404 }
      );
    }

    if (departure.status === 'sold_out') {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: 'Plecarea selectată este sold out.'
        },
        { status: 409 }
      );
    }

    // ── Calculează prețuri
    const numAdults = body.num_adults || 0;
    const numChildren = body.num_children || 0;
    const pricePerPerson = departure.price;
    const totalPrice = pricePerPerson * numAdults;
    const commissionRate = agency.commission_rate || 0;
    const agencyCommission = parseFloat(((totalPrice * commissionRate) / 100).toFixed(2));

    // ── Creează pre_booking
    const { data: booking, error: bookingError } = await supabase
      .from('pre_bookings')
      .insert({
        agency_id: agency.id,
        circuit_id: departure.circuit_id,
        departure_id: departure.id,
        num_adults: numAdults,
        num_children: numChildren,
        room_type: body.room_type,
        passengers: body.passengers,
        price_per_person: pricePerPerson,
        total_price: totalPrice,
        agency_commission: agencyCommission,
        agency_notes: body.agency_notes || null,
        status: 'pending',
        // Câmpuri QuickSell
        qtravel_booking_id: body.qtravel_booking_id || null,
        synced_to_qtravel: body.qtravel_booking_id ? true : false
      })
      .select('id, booking_number, status, created_at')
      .single();

    if (bookingError) {
      console.error('Booking insert error:', bookingError);
      return serverErrorResponse('Eroare la crearea rezervării.');
    }

    // ── Răspuns succes
    return NextResponse.json(
      {
        success: true,
        data: {
          booking_number: booking.booking_number,
          booking_id: booking.id,
          status: booking.status,
          agency: agency.company_name,
          circuit_departure: departure.departure_date,
          total_price: totalPrice,
          agency_commission: agencyCommission,
          created_at: booking.created_at,
          message: "Rezervarea a fost creată cu succes și așteaptă aprobare din partea J'Info Tours."
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return serverErrorResponse();
  }
}

// ── GET - informații despre endpoint (util pentru documentație)
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.json({
    success: true,
    data: {
      endpoint: 'POST /api/v1/bookings',
      description: 'Creează o pre-rezervare în platforma J\'Info B2B',
      required_fields: {
        departure_id: 'string (UUID) - ID plecării din GET /api/v1/circuits/[slug]',
        agency_email: 'string - Email agenției înregistrate în platformă',
        num_adults: 'number - Număr adulți (minim 1)',
        room_type: 'string - Tip cameră: double | single | triple',
        passengers: 'array - Lista pasagerilor [{name, age, passport}]'
      },
      optional_fields: {
        num_children: 'number - Număr copii (default: 0)',
        agency_notes: 'string - Notițe suplimentare',
        qtravel_booking_id: 'string - ID rezervare din QuickSell'
      }
    }
  });
}