/**
 * GET /api/v1/bookings/[booking_number]
 * J'Info B2B Platform - Status rezervare în timp real
 *
 * Headers necesare:
 *   X-API-Key: {api_key}
 *
 * Parametru URL:
 *   booking_number → numărul rezervării (ex: JI-2026-00011)
 *
 * Exemplu request:
 *   GET /api/v1/bookings/JI-2026-00011
 *
 * Răspuns succes:
 * {
 *   "success": true,
 *   "data": {
 *     "booking": { ...status complet }
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ booking_number: string }> }
) {
  // ── Autentificare
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { booking_number } = await params;

    if (!booking_number) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Număr rezervare lipsă.' },
        { status: 400 }
      );
    }

    // ── Query rezervare cu detalii circuit și plecare
    const { data: booking, error } = await supabase
      .from('pre_bookings')
      .select(`
        id,
        booking_number,
        status,
        num_adults,
        num_children,
        room_type,
        total_price,
        agency_commission,
        price_per_person,
        advance_amount,
        amount_paid,
        balance_due,
        advance_deadline,
        final_deadline,
        agency_notes,
        approval_notes,
        rejection_reason,
        approved_at,
        rejected_at,
        cancelled_at,
        qtravel_booking_id,
        created_at,
        updated_at,
        circuits (
          name,
          slug,
          continent,
          nights
        ),
        departures (
          departure_date,
          return_date,
          price,
          status
        ),
        agencies (
          company_name,
          email
        )
      `)
      .eq('booking_number', booking_number.toUpperCase())
      .single();

    if (error || !booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: `Rezervarea ${booking_number} nu există.`
        },
        { status: 404 }
      );
    }

    // ── Mapează statusul într-un mesaj human-readable
    const statusMessages: Record<string, string> = {
      pending: 'Rezervare în așteptare — echipa J\'Info Tours o va procesa în curând.',
      approved: 'Rezervare aprobată.',
      rejected: 'Rezervare respinsă.',
      cancelled: 'Rezervare anulată.',
    };

    // ── Formatează răspunsul
    const formattedBooking = {
      booking_number: booking.booking_number,
      booking_id: booking.id,
      qtravel_booking_id: booking.qtravel_booking_id ?? null,
      status: booking.status,
      status_message: statusMessages[booking.status] || booking.status,

      circuit: {
        name: (booking.circuits as any)?.name ?? null,
        slug: (booking.circuits as any)?.slug ?? null,
        continent: (booking.circuits as any)?.continent ?? null,
        nights: (booking.circuits as any)?.nights ?? null,
      },

      departure: {
        departure_date: (booking.departures as any)?.departure_date ?? null,
        return_date: (booking.departures as any)?.return_date ?? null,
        price_per_person: booking.price_per_person ?? null,
      },

      agency: {
        name: (booking.agencies as any)?.company_name ?? null,
        email: (booking.agencies as any)?.email ?? null,
      },

      travelers: {
        num_adults: booking.num_adults,
        num_children: booking.num_children,
        room_type: booking.room_type,
      },

      financials: {
        total_price: booking.total_price,
        agency_commission: booking.agency_commission,
        advance_amount: booking.advance_amount ?? null,
        amount_paid: booking.amount_paid ?? null,
        balance_due: booking.balance_due ?? null,
        advance_deadline: booking.advance_deadline ?? null,
        final_deadline: booking.final_deadline ?? null,
      },

      notes: {
        agency_notes: booking.agency_notes ?? null,
        approval_notes: booking.approval_notes ?? null,
        rejection_reason: booking.rejection_reason ?? null,
      },

      timestamps: {
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        approved_at: booking.approved_at ?? null,
        rejected_at: booking.rejected_at ?? null,
        cancelled_at: booking.cancelled_at ?? null,
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        booking: formattedBooking
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return serverErrorResponse();
  }
}