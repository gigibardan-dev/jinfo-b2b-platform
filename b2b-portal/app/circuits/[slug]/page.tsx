import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Circuit, Departure } from '@/lib/types/database';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

async function getCircuit(slug: string) {
  const supabase = await createClient();

  const { data: circuit, error } = await supabase
    .from('circuits')
    .select(`
      *,
      departures (
        id,
        departure_date,
        return_date,
        room_type,
        price,
        status
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !circuit) {
    return null;
  }

  return circuit as Circuit & { departures: Departure[] };
}

async function getAgencyCommission(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 8;

    const { data: agency } = await supabase
      .from('agencies')
      .select('commission_rate')
      .eq('user_id', user.id)
      .single();

    return agency?.commission_rate ?? 8;
  } catch {
    return 8;
  }
}

export default async function CircuitPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const [circuit, agencyCommission] = await Promise.all([
    getCircuit(slug),
    getAgencyCommission(),
  ]);

  if (!circuit) {
    notFound();
  }

  // const agencyCommission = 8; <- ȘTERS, vine din DB
  const basePrice = circuit.price_double || 0;
  const agencyPrice = Math.round(basePrice - (basePrice * agencyCommission / 100));

  // Grupează plecările pe luni (compact - doar lunile cu cel mai mic preț)
  const departuresByMonth: Record<string, {
    month: string;
    departures: Departure[];
    minPrice: number;
    count: number;
  }> = {};

  circuit.departures?.forEach((dep) => {
    const date = new Date(dep.departure_date);
    const monthKey = date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

    if (!departuresByMonth[monthKey]) {
      departuresByMonth[monthKey] = {
        month: monthKey,
        departures: [],
        minPrice: dep.price || basePrice,
        count: 0
      };
    }

    departuresByMonth[monthKey].departures.push(dep);
    departuresByMonth[monthKey].count++;

    if (dep.price && dep.price < departuresByMonth[monthKey].minPrice) {
      departuresByMonth[monthKey].minPrice = dep.price;
    }
  });

  const monthGroups = Object.values(departuresByMonth);
  const priceOptions = Array.isArray(circuit.price_options) ? circuit.price_options : [];
  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/"
              className="text-orange-500 hover:text-orange-600 flex items-center gap-2 font-medium transition-colors"
            >
              <span>←</span> Înapoi la circuite
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {circuit.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                    <span>🌍</span>
                    <span className="font-medium capitalize">{circuit.continent}</span>
                  </span>
                  {circuit.nights && (
                    <span className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full">
                      <span>🌙</span>
                      <span className="font-medium">{circuit.nights}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                    <span>📅</span>
                    <span className="font-medium">{circuit.departures?.length || 0} plecări</span>
                  </span>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                {circuit.main_image && (
                  <div className="relative h-96">
                    <Image
                      src={circuit.main_image}
                      alt={circuit.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {Array.isArray(circuit.gallery) && circuit.gallery.length > 1 && (
                  <div className="p-4">
                    <div className="grid grid-cols-4 gap-2">
                      {circuit.gallery.slice(1, 5).map((img: string, i: number) => (
                        <div key={i} className="relative h-24 rounded-lg overflow-hidden hover:opacity-75 transition-opacity cursor-pointer">
                          <Image
                            src={img}
                            alt={`${circuit.name} ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {circuit.short_description && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📖</span>
                    <span>Despre circuit</span>
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {circuit.short_description}
                  </p>
                  {circuit.url && (
                    <a
                      href={circuit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium transition-colors"
                    >
                      <span>Vezi descrierea completă pe jinfotours.ro</span>
                      <span>→</span>
                    </a>
                  )}
                </div>
              )}

              {/* Plecări disponibile - COMPACT cu TOATE OPȚIUNILE + BUTOANE PREREZERVA */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>📅</span>
                  <span>Plecări disponibile</span>
                </h2>

                <div className="space-y-3">
                  {monthGroups.map((group, idx) => (
                    <details key={idx} className="group border-2 border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 transition-colors">
                      <summary className="cursor-pointer list-none p-4 bg-gradient-to-r from-gray-50 to-white hover:from-orange-50 hover:to-white transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📅</span>
                            <div>
                              <div className="font-semibold text-gray-900 capitalize">
                                {group.month}
                              </div>
                              <div className="text-sm text-gray-600">
                                {group.count} {group.count === 1 ? 'plecare' : 'plecări'} disponibil{group.count === 1 ? 'ă' : 'e'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">De la:</div>
                              <div className="text-2xl font-bold text-orange-500">
                                {Math.round(group.minPrice - (group.minPrice * agencyCommission / 100))} EUR
                              </div>
                            </div>
                            <span className="text-orange-500 group-open:rotate-180 transition-transform text-xl">
                              ▼
                            </span>
                          </div>
                        </div>
                      </summary>

                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-4">
                          {group.departures.map((dep, i) => {
                            const depDate = new Date(dep.departure_date);
                            const retDate = new Date(dep.return_date);

                            return (
                              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                                {/* Header Date */}
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div>
                                      <div className="font-semibold text-gray-900">
                                        {depDate.toLocaleDateString('ro-RO', {
                                          day: 'numeric',
                                          month: 'long'
                                        })}
                                        <span className="text-orange-500 mx-2">→</span>
                                        {retDate.toLocaleDateString('ro-RO', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {dep.status === 'disponibil' ? '✓ Disponibil' : dep.status}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* TOATE OPȚIUNILE DE PREȚ CU BUTOANE */}
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    Opțiuni de cazare:
                                  </div>
                                  {priceOptions.map((option: any, optIdx: number) => {
                                    const optPrice = option.price || 0;
                                    const agencyOptPrice = Math.round(optPrice - (optPrice * agencyCommission / 100));

                                    return (
                                      <div
                                        key={optIdx}
                                        className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:border-orange-300 transition-colors"
                                      >
                                        <div className="flex-1 pr-3 min-w-0">
                                          <div className="font-medium text-gray-900 text-sm">
                                            {option.type}
                                          </div>
                                          {option.info && (
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                              {option.info.replace(/\t+/g, ' ').trim()}
                                            </div>
                                          )}
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                          <div className="text-xl font-bold text-orange-500 whitespace-nowrap">
                                            {agencyOptPrice} {option.currency || 'EUR'}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Preț public:</span>
                                            <span className="text-sm text-gray-400 line-through font-semibold">
                                              {Math.round(optPrice)} {option.currency || 'EUR'}
                                            </span>
                                          </div>
                                        </div>

                                        <Link
                                          href={`/circuits/${circuit.slug}/book?departure=${dep.id}&price_option=${optIdx}`}
                                          className="shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md text-sm whitespace-nowrap"
                                        >
                                          🎯 Prerezerva
                                        </Link>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>

                {monthGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📅</div>
                    <div>Nicio plecare disponibilă momentan</div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Card - cu prima plecare disponibilă */}
              <div className="bg-white rounded-xl p-6 shadow-lg top-20 border-2 border-orange-100 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-600 mb-2">Preț agenție de la</div>
                  <div className="text-5xl font-bold text-orange-500">
                    {agencyPrice}
                    <span className="text-xl font-normal text-gray-600">€</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">per persoană în cameră dublă</div>
                </div>

                <div className="border-t border-b border-gray-200 py-4 my-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Preț public:</span>
                    <span className="font-semibold text-gray-500 line-through">{Math.round(basePrice)} EUR</span>
                  </div>
                  <div className="flex justify-between items-center text-green-600 font-medium">
                    <span>Comision ({agencyCommission}%):</span>
                    <span className="text-lg">-{Math.round(basePrice - agencyPrice)} EUR</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-900">Câștig tău:</span>
                    <span className="text-xl font-bold text-green-600">{Math.round(basePrice - agencyPrice)} EUR</span>
                  </div>
                </div>

                {circuit.departures?.[0] ? (
                  <Link
                    href={`/circuits/${circuit.slug}/book?departure=${circuit.departures[0].id}&price_option=0`}
                    className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl text-lg text-center"
                  >
                    🎯 Creează pre-rezervare
                  </Link>
                ) : (
                  <div className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-semibold text-lg text-center cursor-not-allowed">
                    Nicio plecare disponibilă
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
                  {circuit.departures?.[0]
                    ? 'Pre-rezervarea necesită validare de la J\'Info Tours (răspuns în max 24h)'
                    : 'Momentan nu există plecări disponibile pentru acest circuit'
                  }
                </p>
              </div>

              {/* Opțiuni preț - Toate variantele */}
              {priceOptions.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span>💰</span>
                    <span>Opțiuni de cazare</span>
                  </h3>
                  <div className="space-y-3">
                    {priceOptions.map((option: any, idx: number) => {
                      const optPrice = option.price || 0;
                      const agencyOptPrice = Math.round(optPrice - (optPrice * agencyCommission / 100));

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm mb-1">
                                {option.type}
                              </div>
                              {option.info && (
                                <div className="text-xs text-gray-500">
                                  {option.info.replace(/\t+/g, ' ').trim()}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-orange-500 text-lg">
                                {agencyOptPrice} {option.currency || 'EUR'}
                              </div>
                              <div className="text-xs text-gray-400 line-through">
                                {Math.round(optPrice)} {option.currency || 'EUR'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 text-sm space-y-3 border border-blue-100">
                <div className="flex items-start gap-3">
                  <span className="text-xl">ℹ️</span>
                  <span className="text-gray-700">
                    Toate prețurile includ comisionul tău de <strong>{agencyCommission}%</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📞</span>
                  <span className="text-gray-700">
                    Întrebări? <strong>info@jinfotours.ro</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚡</span>
                  <span className="text-gray-700">
                    Pre-rezervări validate în <strong>max 24h</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Program complet - Iframe FULL WIDTH */}
          {circuit.url && (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-8">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📋</span>
                  <span>Program complet și detalii circuit</span>
                </h2>
                <p className="text-orange-100 text-sm mt-2">
                  Program zilnic, servicii incluse/neincluse, excursii opționale
                </p>
              </div>

              <div className="relative">
                <iframe
                  src={circuit.url}
                  className="w-full border-0 bg-white"
                  style={{
                    minHeight: '1500px',
                    height: 'auto'
                  }}
                  title="Detalii circuit complet"
                  loading="lazy"
                />

                <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    💡 Conținut preluat direct de pe jinfotours.ro
                  </span>
                  <a
                    href={circuit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium transition-colors text-sm"
                  >
                    <span>🔗 Deschide în fereastră nouă</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}