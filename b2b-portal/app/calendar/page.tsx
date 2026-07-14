import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CalendarClient from './CalendarClient';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Calendar Plecări | J\'Info Tours B2B',
  description: 'Vizualizează toate plecările disponibile pe calendar lunar',
};

async function getDepartures() {
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
        discount_percentage
      )
    `)
    .gte('departure_date', new Date().toISOString().split('T')[0])
    .order('departure_date', { ascending: true });

  if (error) {
    console.error('Error fetching departures for calendar:', error);
    return [];
  }

  return (data || [])
    .filter((d: any) => d.circuits !== null)
    .map((d: any) => ({
      ...d,
      circuits: Array.isArray(d.circuits) ? d.circuits[0] : d.circuits,
    }));
}

export default async function CalendarPage() {
  const departures = await getDepartures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
      <Header />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Se încarcă calendarul...</p>
          </div>
        </div>
      }>
        <CalendarClient departures={departures} />
      </Suspense>
      <Footer />
    </div>
  );
}