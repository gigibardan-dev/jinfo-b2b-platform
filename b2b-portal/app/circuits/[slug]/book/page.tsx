import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getCurrentUser, getUserRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PreBookingForm from '@/components/booking/PreBookingForm';
import type { Circuit, Departure } from '@/lib/types/database';
import Image from 'next/image';
import Link from 'next/link';

async function getCircuitAndDeparture(slug: string, departureId: string) {
  const supabase = await createClient();
  
  // Get circuit
  const { data: circuit, error: circuitError } = await supabase
    .from('circuits')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (circuitError || !circuit) {
    return { circuit: null, departure: null };
  }

  // Get specific departure
  const { data: departure, error: departureError } = await supabase
    .from('departures')
    .select('*')
    .eq('id', departureId)
    .eq('circuit_id', circuit.id)
    .single();

  if (departureError || !departure) {
    return { circuit: null, departure: null };
  }

  return { circuit, departure };
}

async function getAgencyData(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function BookingPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ departure?: string; price_option?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole(user.id);
  
  // Only active agencies can book
  if (role !== 'agency') {
    redirect('/dashboard');
  }

  const { slug } = await params;
  const { departure: departureId, price_option: priceOptionIndex } = await searchParams;

  if (!departureId) {
    redirect(`/circuits/${slug}`);
  }

  const { circuit, departure } = await getCircuitAndDeparture(slug, departureId);
  
  if (!circuit || !departure) {
    notFound();
  }

  const agencyData = await getAgencyData(user.id);
  
  if (!agencyData) {
    redirect('/dashboard');
  }

  // Get price option
  const priceOptions = Array.isArray(circuit.price_options) ? circuit.price_options : [];
  const selectedPriceOptionIndex = priceOptionIndex ? parseInt(priceOptionIndex) : 0;
  const priceOption = priceOptions[selectedPriceOptionIndex] || {
    type: 'Persoana in camera dubla',
    price: circuit.price_double || 0,
    currency: 'EUR'
  };

  const depDate = new Date(departure.departure_date);
  const retDate = new Date(departure.return_date);

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              href={`/circuits/${slug}`}
              className="text-orange-500 hover:text-orange-600 inline-flex items-center gap-2 font-medium transition-colors"
            >
              <span>←</span>
              <span>Înapoi la circuit</span>
            </Link>
          </div>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">🎯</div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Creare Pre-Rezervare
                  </h1>
                  <p className="text-orange-100">
                    Completează datele pentru a crea o pre-rezervare
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <PreBookingForm
                circuit={circuit as Circuit}
                departure={departure as Departure}
                agencyId={agencyData.id}
                priceOption={priceOption}
              />
            </div>

            {/* Sidebar - Circuit Summary */}
            <div className="space-y-6">
              {/* Circuit Info */}
              <div className="bg-white rounded-xl p-6 shadow-lg sticky top-20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  <span>Detalii circuit</span>
                </h3>

                {circuit.main_image && (
                  <div className="relative h-40 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={circuit.main_image}
                      alt={circuit.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Circuit</div>
                    <div className="font-bold text-gray-900">{circuit.name}</div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm text-gray-600 mb-1">Plecare</div>
                    <div className="font-semibold text-gray-900">
                      {depDate.toLocaleDateString('ro-RO', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm text-gray-600 mb-1">Întoarcere</div>
                    <div className="font-semibold text-gray-900">
                      {retDate.toLocaleDateString('ro-RO', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {circuit.nights && (
                    <div className="border-t border-gray-200 pt-3">
                      <div className="text-sm text-gray-600 mb-1">Durată</div>
                      <div className="font-semibold text-gray-900">{circuit.nights}</div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm text-gray-600 mb-1">Opțiune cazare</div>
                    <div className="font-semibold text-gray-900">{priceOption.type}</div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm text-gray-600 mb-1">Continent</div>
                    <div className="font-semibold text-gray-900 capitalize">{circuit.continent}</div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 text-sm space-y-3 border border-blue-100">
                <div className="flex items-start gap-3">
                  <span className="text-xl">ℹ️</span>
                  <span className="text-gray-700">
                    Pre-rezervarea va fi trimisă către J'Info Tours pentru validare
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚡</span>
                  <span className="text-gray-700">
                    Răspuns în <strong>maximum 24 ore</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📧</span>
                  <span className="text-gray-700">
                    Vei primi email când statusul se schimbă
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}