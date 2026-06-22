// components/circuits/CircuitCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { applyDiscount, getAgencyCommission } from '@/lib/types/database';

interface CircuitCardProps {
  circuit: {
    id: string;
    name: string;
    slug: string;
    nights: string | null;
    main_image: string | null;
    price_double: number | null;
    price_single: number | null;
    is_discounted: boolean;
    discount_percentage: number | null;
    discount_valid_until: string | null;
    departures: any[];
  };
  commissionRate?: number; // vine din agencies.commission_rate
}

export default function CircuitCard({ circuit, commissionRate = 10 }: CircuitCardProps) {
  // ── Prețuri ────────────────────────────────────────────────────────────────
  const originalPrice  = circuit.price_double                          // preț din scraping
  const effectivePrice = circuit.is_discounted                         // preț efectiv (redus sau original)
    ? applyDiscount(originalPrice, circuit.discount_percentage)
    : originalPrice
  const commission     = getAgencyCommission(effectivePrice, commissionRate) // comision din prețul redus
  const agencyPrice    = effectivePrice && commission
    ? effectivePrice - commission
    : null

  // ── Nopți ──────────────────────────────────────────────────────────────────
  const nightsNumber = circuit.nights?.match(/\d+/)?.[0] || ''

  // ── Prima plecare disponibilă ──────────────────────────────────────────────
  const firstDeparture = circuit.departures?.find((d: any) => d.status === 'disponibil')
  const departureDate  = firstDeparture ? new Date(firstDeparture.departure_date ?? firstDeparture.departureDate) : null

  return (
    <Link href={`/circuits/${circuit.slug}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col border border-gray-100">

        {/* ── Imagine ── */}
        <div className="relative h-48 bg-gray-100">
          {circuit.main_image && (
            <Image
              src={circuit.main_image}
              alt={circuit.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Badge reducere — cel mai prominent, sus stânga */}
          {circuit.is_discounted && circuit.discount_percentage && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              🏷️ -{circuit.discount_percentage}%
            </div>
          )}

          {/* Badge nopți — sus dreapta */}
          {nightsNumber && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {nightsNumber} nopți
            </div>
          )}

          {/* Badge plecări — jos stânga (doar dacă nu e reducere) */}
          {circuit.departures?.length > 0 && !circuit.is_discounted && (
            <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {circuit.departures.length} plecări
            </div>
          )}

          {/* Badge plecări — jos stânga când e și reducere */}
          {circuit.departures?.length > 0 && circuit.is_discounted && (
            <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {circuit.departures.length} plecări
            </div>
          )}
        </div>

        {/* ── Conținut ── */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[3rem] text-base">
            {circuit.name}
          </h3>

          {/* Prima plecare */}
          {departureDate && (
            <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
              <span>📅</span>
              <span>
                Prima plecare:{' '}
                {departureDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}

          <div className="mt-auto">
            {effectivePrice && effectivePrice > 0 ? (
              <div className="space-y-1 mb-3">

                {/* Rândul 1: Preț listă (original) — tăiat dacă e reducere */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Preț listă:</span>
                  {circuit.is_discounted && originalPrice ? (
                    <span className="text-sm text-gray-400 line-through">
                      {originalPrice.toLocaleString('ro-RO')} EUR
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600 font-medium">
                      {effectivePrice.toLocaleString('ro-RO')} EUR
                    </span>
                  )}
                </div>

                {/* Rândul 2: Preț redus — doar dacă e reducere */}
                {circuit.is_discounted && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-600">Preț redus:</span>
                    <span className="text-sm font-bold text-orange-600">
                      {effectivePrice.toLocaleString('ro-RO')} EUR
                    </span>
                  </div>
                )}

                {/* Rândul 3: Prețul tău (după comision) */}
                <div className="flex items-baseline justify-between pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-600 font-medium">Prețul tău:</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-orange-500">
                      {agencyPrice ? Math.round(agencyPrice).toLocaleString('ro-RO') : '—'}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">EUR</span>
                  </div>
                </div>

                {/* Rândul 4: Comisionul tău */}
                {commission && commission > 0 && (
                  <div className="text-xs text-green-600 font-medium text-right">
                    Comisionul tău: {commission.toLocaleString('ro-RO')} EUR ({commissionRate}%)
                  </div>
                )}

              </div>
            ) : (
              <div className="mb-3 text-center py-2">
                <span className="text-sm text-gray-500">Preț la cerere</span>
              </div>
            )}

            {/* Buton */}
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold transition-colors text-sm">
              Vezi detalii →
            </button>
          </div>
        </div>

      </div>
    </Link>
  );
}