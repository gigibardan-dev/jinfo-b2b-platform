// lib/services/agencies.ts — b2b
// La activare: setează rol în user_profiles + creează cont în jinfocruise

import { createClient } from '@/lib/supabase/server';
import { Agency, AgencyStats, UpdateAgencyData, AgencySummary } from '@/lib/types/agency';

// ─── Helper: creează/actualizează cont în jinfocruise ────────────────────────
async function syncAgencyToJinfocruise(agency: {
  email: string;
  company_name: string;
  contact_person: string;
  phone: string | null;
  commission_rate: number | null;
}): Promise<void> {
  const jinfocruiseUrl = process.env.JINFOCRUISE_URL;
  const b2bApiKey      = process.env.JINFO_API_KEY;

  if (!jinfocruiseUrl || !b2bApiKey) {
    console.warn("[sync-jinfocruise] JINFOCRUISE_URL sau JINFO_API_KEY lipsesc — skip sync.");
    return;
  }

  try {
    const res = await fetch(`${jinfocruiseUrl}/api/b2b/create-agency-account`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "X-B2B-Secret": b2bApiKey,
      },
      body: JSON.stringify({
        email:          agency.email,
        company_name:   agency.company_name,
        contact_person: agency.contact_person,
        phone:          agency.phone,
        commission_pct: agency.commission_rate ?? 10,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("[sync-jinfocruise] Sync eșuat:", data?.error ?? `HTTP ${res.status}`);
    } else {
      console.log(`[sync-jinfocruise] ✓ ${agency.email} → jinfocruise (${data.is_new ? "nou" : "actualizat"})`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[sync-jinfocruise] Eroare rețea:", msg);
    // Nu aruncăm eroarea — activarea în b2b rămâne validă chiar dacă sync-ul eșuează
  }
}

// ─── getAllAgencies ───────────────────────────────────────────────────────────
export async function getAllAgencies(statusFilter: string = 'all'): Promise<Agency[]> {
  const supabase = await createClient();

  let query = supabase
    .from('agencies')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: agencies, error } = await query;

  if (error) {
    console.error('Error fetching agencies:', error);
    throw error;
  }

  const enrichedAgencies = await Promise.all(
    (agencies || []).map(async (agency) => {
      const { data: bookings } = await supabase
        .from('pre_bookings')
        .select('id, status, total_price')
        .eq('agency_id', agency.id);

      const total_bookings     = bookings?.length || 0;
      const pending_bookings   = bookings?.filter(b => b.status === 'pending').length || 0;
      const confirmed_bookings = bookings?.filter(b => b.status === 'approved').length || 0;
      const validated_bookings = confirmed_bookings;

      const bookingIds = bookings?.map(b => b.id) || [];
      let total_commission = 0;

      if (bookingIds.length > 0) {
        const { data: payments } = await supabase
          .from('payment_records')
          .select('amount')
          .in('pre_booking_id', bookingIds);

        const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0) || 0;
        total_commission = totalPaid * (agency.commission_rate / 100);
      }

      return {
        ...agency,
        total_bookings,
        pending_bookings,
        confirmed_bookings,
        validated_bookings,
        total_commission,
      };
    })
  );

  return enrichedAgencies as Agency[];
}

// ─── getAgencyStatistics ──────────────────────────────────────────────────────
export async function getAgencyStatistics(agencyId: string): Promise<AgencyStats> {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('commission_rate')
    .eq('id', agencyId)
    .single();

  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select('id, status, total_price')
    .eq('agency_id', agencyId);

  const stats = {
    total_bookings:     bookings?.length || 0,
    pending_bookings:   bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed_bookings: bookings?.filter(b => b.status === 'approved').length || 0,
    validated_bookings: bookings?.filter(b => b.status === 'approved').length || 0,
    total_commission:   0,
  };

  if (agency && bookings) {
    const bookingIds = bookings.map(b => b.id);
    if (bookingIds.length > 0) {
      const { data: payments } = await supabase
        .from('payment_records')
        .select('amount')
        .in('pre_booking_id', bookingIds);

      const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0) || 0;
      stats.total_commission = totalPaid * (agency.commission_rate / 100);
    }
  }

  return stats;
}

// ─── updateAgency ─────────────────────────────────────────────────────────────
export async function updateAgency(agencyId: string, data: UpdateAgencyData): Promise<Agency> {
  const supabase = await createClient();

  const { data: updatedAgency, error } = await supabase
    .from('agencies')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', agencyId)
    .select()
    .single();

  if (error) throw error;
  return updatedAgency as Agency;
}

// ─── suspendAgency ────────────────────────────────────────────────────────────
export async function suspendAgency(agencyId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('agencies')
    .update({
      status:       'suspended',
      suspended_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', agencyId);

  if (error) throw error;
}

// ─── activateAgency ───────────────────────────────────────────────────────────
export async function activateAgency(agencyId: string): Promise<void> {
  const supabase = await createClient();

  // Preluăm datele agenției inclusiv user_id și email pentru sync
  const { data: agency } = await supabase
    .from('agencies')
    .select('approved_at, user_id, email, company_name, contact_person, phone, commission_rate')
    .eq('id', agencyId)
    .single();

  const updateData: any = {
    status:           'active',
    suspended_at:     null,
    suspension_reason: null,
    updated_at:       new Date().toISOString(),
  };

  const isFirstActivation = !agency?.approved_at;

  if (isFirstActivation) {
    updateData.approved_at = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) updateData.approved_by = user.id;
  }

  const { error } = await supabase
    .from('agencies')
    .update(updateData)
    .eq('id', agencyId);

  if (error) throw error;

  // ── Setează rolul agency în user_profiles ─────────────────────────────────
  if (agency?.user_id) {
    await supabase
      .from('user_profiles')
      .upsert({
        id:         agency.user_id,
        role:       'agency',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
  }

  // ── Sync spre jinfocruise (doar la prima activare) ────────────────────────
  if (isFirstActivation && agency?.email) {
    // Fire-and-forget — nu blocăm răspunsul
    syncAgencyToJinfocruise({
      email:           agency.email,
      company_name:    agency.company_name,
      contact_person:  agency.contact_person,
      phone:           agency.phone ?? null,
      commission_rate: agency.commission_rate ?? 10,
    }).catch(err => {
      console.error("[activateAgency] Sync jinfocruise error:", err);
    });
  }
}

// ─── getAgenciesSummary ───────────────────────────────────────────────────────
export async function getAgenciesSummary(): Promise<AgencySummary> {
  const supabase = await createClient();

  const { data: agencies } = await supabase
    .from('agencies')
    .select('status');

  return {
    total:     agencies?.length || 0,
    active:    agencies?.filter(a => a.status === 'active').length || 0,
    pending:   agencies?.filter(a => a.status === 'pending').length || 0,
    suspended: agencies?.filter(a => a.status === 'suspended').length || 0,
  };
}