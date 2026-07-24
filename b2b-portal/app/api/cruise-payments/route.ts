// app/api/cruise-payments/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCruiseBookingPayments, createCruisePayment } from '@/lib/services/cruise-payments';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    if (!bookingId) return NextResponse.json({ error: 'booking_id required' }, { status: 400 });

    const payments = await getCruiseBookingPayments(bookingId);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching cruise payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'superadmin' && profile?.role !== 'operator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const payment = await createCruisePayment(body, user.id);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating cruise payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}