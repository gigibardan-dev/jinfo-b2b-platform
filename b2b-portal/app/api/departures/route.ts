import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('departures')
      .select(`
        id,
        departure_date,
        return_date,
        status,
        circuit_id,
        circuits (
          id,
          slug,
          name,
          continent,
          nights,
          main_image,
          price_double,
          discount_percentage,
          is_active
        )
      `)
      .gte('departure_date', new Date().toISOString().split('T')[0])
      .eq('circuits.is_active', true)
      .order('departure_date', { ascending: true });

    if (error) {
      console.error('Supabase error departures:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filtrăm înregistrările unde circuits e null (circuite inactive)
    const filtered = (data || []).filter((d: any) => d.circuits !== null);

    return NextResponse.json({ departures: filtered });
  } catch (err) {
    console.error('Departures API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}