import { createClient } from '@/lib/supabase/server';
import { Agency, AgencyStats, UpdateAgencyData, AgencySummary } from '@/lib/types/agency';

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

  // Enrich each agency with statistics
  const enrichedAgencies = await Promise.all(
    (agencies || []).map(async (agency) => {
      // Get booking counts
      const { data: bookings } = await supabase
        .from('pre_bookings')
        .select('status, total_price')
        .eq('agency_id', agency.id);

      const total_bookings = bookings?.length || 0;
      const pending_bookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const confirmed_bookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const validated_bookings = bookings?.filter(b => b.status === 'validated').length || 0;

      // Calculate total commission from confirmed bookings
      const total_commission = bookings
        ?.filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.total_price * (agency.commission_rate / 100)), 0) || 0;

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

export async function getAgencyStatistics(agencyId: string): Promise<AgencyStats> {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('commission_rate')
    .eq('id', agencyId)
    .single();

  const { data: bookings } = await supabase
    .from('pre_bookings')
    .select('status, total_price')
    .eq('agency_id', agencyId);

  const stats = {
    total_bookings: bookings?.length || 0,
    pending_bookings: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed_bookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
    validated_bookings: bookings?.filter(b => b.status === 'validated').length || 0,
    total_commission: 0,
  };

  if (agency && bookings) {
    stats.total_commission = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_price * (agency.commission_rate / 100)), 0);
  }

  return stats;
}

export async function updateAgency(
  agencyId: string,
  data: UpdateAgencyData
): Promise<Agency> {
  const supabase = await createClient();

  const updateData: any = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedAgency, error } = await supabase
    .from('agencies')
    .update(updateData)
    .eq('id', agencyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating agency:', error);
    throw error;
  }

  return updatedAgency as Agency;
}

export async function suspendAgency(agencyId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('agencies')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', agencyId);

  if (error) {
    console.error('Error suspending agency:', error);
    throw error;
  }
}

export async function activateAgency(agencyId: string): Promise<void> {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from('agencies')
    .select('approved_at')
    .eq('id', agencyId)
    .single();

  const updateData: any = {
    status: 'active',
    suspended_at: null,
    suspension_reason: null,
    updated_at: new Date().toISOString(),
  };

  // If activating for the first time (was pending), set approved_at
  if (!agency?.approved_at) {
    updateData.approved_at = new Date().toISOString();
    
    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      updateData.approved_by = user.id;
    }
  }

  const { error } = await supabase
    .from('agencies')
    .update(updateData)
    .eq('id', agencyId);

  if (error) {
    console.error('Error activating agency:', error);
    throw error;
  }
}

export async function getAgenciesSummary(): Promise<AgencySummary> {
  const supabase = await createClient();

  const { data: agencies } = await supabase
    .from('agencies')
    .select('status');

  const summary = {
    total: agencies?.length || 0,
    active: agencies?.filter(a => a.status === 'active').length || 0,
    pending: agencies?.filter(a => a.status === 'pending').length || 0,
    suspended: agencies?.filter(a => a.status === 'suspended').length || 0,
  };

  return summary;
}
