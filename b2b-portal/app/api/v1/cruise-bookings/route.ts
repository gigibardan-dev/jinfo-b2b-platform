/**
 * /api/v1/cruise-bookings — J'Info B2B Platform
 *
 * POST  → primește o rezervare croazieră din jinfocruise (sau alt sistem extern)
 * GET   → lista rezervări croaziere per agenție (opțional filtru status)
 *
 * Headers:
 *   X-API-Key: {JINFO_API_KEY}
 *   Content-Type: application/json
 *
 * Body POST (câmpuri obligatorii marcate cu *):
 * {
 *   agency_email*:           "croaziere@jinfotours.ro",
 *   jinfocruise_jinfo_no*:   "JINFO-3042",
 *   jinfocruise_reservation_id: "uuid",   // opțional dar recomandat
 *   cruise_id*:              "MSC-ABCDE",
 *   ship_code:               "WE",
 *   ship_name:               "MSC World Europa",
 *   sailing_date:            "2026-08-15",
 *   sailing_port:            "GEN",
 *   nights:                  7,
 *   itin_desc:               "Genova, Barcelona, Marsilia",
 *   category_code:           "BL2",
 *   category_name:           "Balcon Premium",
 *   cabin_no:                "10045",
 *   fare_desc:               "Fantastica",
 *   num_adults*:             2,
 *   num_children:            0,
 *   passengers*:             [{...}],     // format detaliat mai jos
 *   gross_amount:            2800,
 *   net_amount:              2520,
 *   port_charges:            180,
 *   service_charge_total:    140,
 *   agency_notes:            "Client VIP",
 * }
 *
 * Format pasager:
 * {
 *   pax_order:     1,
 *   pax_type:      "adult" | "child" | "infant",
 *   first_name:    "Ion",
 *   last_name:     "Popescu",
 *   gender:        "M" | "F",
 *   date_of_birth: "1985-03-20",
 *   nationality:   "ROU",
 *   email:         "ion@example.com",   // opțional, lead passenger
 *   phone:         "+40721000000",      // opțional, lead passenger
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateApiKey,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/api/validateApiKey";

// Service role — bypass RLS, server-side only
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CB-${year}-${rand}`;
}

async function findAgency(email: string) {
  const { data, error } = await supabase
    .from("agencies")
    .select("id, company_name, commission_rate, status, approved_at, suspended_at")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  return { agency: data, error };
}

// ─── POST — creare rezervare croazieră ────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    // ── Validare câmpuri obligatorii
    const required = ["agency_email", "jinfocruise_jinfo_no", "cruise_id", "num_adults", "passengers"];
    const missing = required.filter((f) => !body[f] && body[f] !== 0);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: `Câmpuri obligatorii lipsă: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.passengers) || body.passengers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Lista de pasageri este goală sau invalidă." },
        { status: 400 }
      );
    }

    if (typeof body.num_adults !== "number" || body.num_adults < 1) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "num_adults trebuie să fie minim 1." },
        { status: 400 }
      );
    }

    // ── Verifică dacă rezervarea nu există deja (idempotență pe jinfo_no)
    const { data: existing } = await supabase
      .from("cruise_bookings")
      .select("id, booking_number, status")
      .eq("jinfocruise_jinfo_no", body.jinfocruise_jinfo_no)
      .maybeSingle();

    if (existing) {
      // Returnează booking-ul existent fără a crea duplicat
      return NextResponse.json(
        {
          success: true,
          data: {
            booking_number: existing.booking_number,
            booking_id: existing.id,
            status: existing.status,
            message: "Rezervare deja existentă — returnăm booking-ul existent.",
            already_existed: true,
          },
        },
        { status: 200 }
      );
    }

    // ── Mapare agenție după email
    const { agency, error: agencyError } = await findAgency(body.agency_email);

    if (agencyError) {
      console.error("[cruise-bookings] Agency lookup error:", agencyError);
      return serverErrorResponse("Eroare la căutarea agenției.");
    }

    if (!agency) {
      return NextResponse.json(
        {
          success: false,
          error: "Unprocessable Entity",
          message: `Agenția cu email-ul "${body.agency_email}" nu este înregistrată în platformă. Contactați J'Info Tours pentru înregistrare.`,
        },
        { status: 422 }
      );
    }

    // ── Verifică status agenție
    if (!agency.approved_at) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Agenția nu este aprobată încă în platformă." },
        { status: 403 }
      );
    }
    if (agency.suspended_at) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Agenția este suspendată. Contactați J'Info Tours." },
        { status: 403 }
      );
    }

    // ── Calculează comision dacă nu vine din exterior
    const grossAmount = body.gross_amount ?? null;
    const commissionRate = agency.commission_rate ?? 10;
    const agencyCommission =
      grossAmount != null
        ? parseFloat(((grossAmount * commissionRate) / 100).toFixed(2))
        : null;

    // ── Generează booking_number unic
    let bookingNumber = generateBookingNumber();
    // Asigură unicitate (extrem de rar, dar safe)
    let attempts = 0;
    while (attempts < 5) {
      const { data: conflict } = await supabase
        .from("cruise_bookings")
        .select("id")
        .eq("booking_number", bookingNumber)
        .maybeSingle();
      if (!conflict) break;
      bookingNumber = generateBookingNumber();
      attempts++;
    }

    // ── Insert cruise_booking
    const { data: booking, error: bookingError } = await supabase
      .from("cruise_bookings")
      .insert({
        booking_number:              bookingNumber,
        jinfocruise_reservation_id:  body.jinfocruise_reservation_id ?? null,
        jinfocruise_jinfo_no:        body.jinfocruise_jinfo_no,
        agency_id:                   agency.id,
        cruise_id:                   body.cruise_id,
        ship_code:                   body.ship_code ?? null,
        ship_name:                   body.ship_name ?? null,
        sailing_date:                body.sailing_date ?? null,
        sailing_port:                body.sailing_port ?? null,
        nights:                      body.nights ?? null,
        itin_desc:                   body.itin_desc ?? null,
        category_code:               body.category_code ?? null,
        category_name:               body.category_name ?? null,
        cabin_no:                    body.cabin_no ?? null,
        fare_desc:                   body.fare_desc ?? null,
        num_adults:                  body.num_adults,
        num_children:                body.num_children ?? 0,
        passengers:                  body.passengers,           // JSONB
        gross_amount:                grossAmount,
        net_amount:                  body.net_amount ?? null,
        port_charges:                body.port_charges ?? null,
        service_charge_total:        body.service_charge_total ?? null,
        agency_commission:           agencyCommission,
        commission_rate:             commissionRate,
        deposit_amount:              grossAmount ? parseFloat((grossAmount * 0.3).toFixed(2)) : null,
        amount_paid:                 0,
        balance_due:                 grossAmount,
        status:                      "pending",
        agency_notes:                body.agency_notes ?? null,
        synced_from_jinfocruise:     true,
        synced_at:                   new Date().toISOString(),
        last_sync_at:                new Date().toISOString(),
      })
      .select("id, booking_number, status, created_at")
      .single();

    if (bookingError) {
      console.error("[cruise-bookings] Insert error:", bookingError);
      return serverErrorResponse("Eroare la crearea rezervării croazieră.");
    }

    // ── Răspuns succes
    return NextResponse.json(
      {
        success: true,
        data: {
          booking_number:    booking.booking_number,
          booking_id:        booking.id,
          status:            booking.status,
          agency:            agency.company_name,
          jinfocruise_no:    body.jinfocruise_jinfo_no,
          gross_amount:      grossAmount,
          agency_commission: agencyCommission,
          created_at:        booking.created_at,
          message:           "Rezervarea croazieră a fost înregistrată cu succes în platforma B2B.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[cruise-bookings] Unexpected error:", error);
    return serverErrorResponse();
  }
}

// ─── GET — lista rezervări croaziere (pentru verificare / dashboard) ──────────

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const agencyEmail = searchParams.get("agency_email");
    const status      = searchParams.get("status");
    const limit       = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

    let query = supabase
      .from("cruise_bookings")
      .select(`
        id, booking_number, jinfocruise_jinfo_no, status,
        cruise_id, ship_name, sailing_date, nights, itin_desc,
        category_name, num_adults, num_children,
        gross_amount, agency_commission, amount_paid, balance_due,
        synced_from_jinfocruise, synced_at, created_at, updated_at,
        agencies ( company_name, email )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status)      query = query.eq("status", status);
    if (agencyEmail) {
      // Join indirect prin agency_id
      const { agency } = await findAgency(agencyEmail);
      if (!agency) {
        return NextResponse.json({ success: true, data: { bookings: [], total: 0 } });
      }
      query = query.eq("agency_id", agency.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[cruise-bookings] GET error:", error);
      return serverErrorResponse("Eroare la preluarea rezervărilor.");
    }

    return NextResponse.json({
      success: true,
      data: {
        bookings: data ?? [],
        total:    data?.length ?? 0,
      },
    });
  } catch (error) {
    console.error("[cruise-bookings] GET unexpected error:", error);
    return serverErrorResponse();
  }
}