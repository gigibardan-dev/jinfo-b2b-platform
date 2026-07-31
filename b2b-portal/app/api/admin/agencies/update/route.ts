import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateAgency } from '@/lib/services/agencies';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      agencyId,
      commission_rate,
      contact_person,
      phone,
      admin_notes,
      agency_display_name,
      logo_url,
    } = body;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID is required' }, { status: 400 });
    }

    if (commission_rate !== undefined) {
      if (commission_rate < 0 || commission_rate > 100) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (commission_rate !== undefined)     updateData.commission_rate    = commission_rate;
    if (contact_person !== undefined)      updateData.contact_person     = contact_person;
    if (phone !== undefined)               updateData.phone              = phone;
    if (admin_notes !== undefined)         updateData.admin_notes        = admin_notes;
    if (agency_display_name !== undefined) updateData.agency_display_name = agency_display_name;
    if (logo_url !== undefined)            updateData.logo_url           = logo_url;

    const updatedAgency = await updateAgency(agencyId, updateData);

    return NextResponse.json({ success: true, agency: updatedAgency });

  } catch (error) {
    console.error('Error updating agency:', error);
    return NextResponse.json({ error: 'Failed to update agency' }, { status: 500 });
  }
}