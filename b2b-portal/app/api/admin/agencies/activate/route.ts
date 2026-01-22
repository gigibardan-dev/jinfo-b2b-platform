import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateAgency } from '@/lib/services/agencies';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get agency ID from request
    const { agencyId } = await request.json();

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Activate agency
    await activateAgency(agencyId);

    // TODO: Send email notification to agency about activation

    return NextResponse.json({
      success: true,
      message: 'Agency activated successfully',
    });

  } catch (error) {
    console.error('Error activating agency:', error);
    return NextResponse.json(
      { error: 'Failed to activate agency' },
      { status: 500 }
    );
  }
}